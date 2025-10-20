<?php
namespace App\Http\Controllers;

use App\Models\{Loan, LoanLine, InventoryItem, StockMove};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $r)
    {
        $user = $r->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $q = Loan::with(['lines.inventoryItem.item', 'inventory.department'])
            ->when($r->filled('status'), fn($qq) => $qq->where('status', $r->status))
            ->orderByDesc('id');

        if ($r->filled('inventory_id')) {
            $q->where('inventory_id', (int) $r->inventory_id);
        }

        // ✅ Lab facilitator scoping: limit to own dept via inventory->department
        if (($user->role ?? '') === 'lab_faci') {
            $userDept = strtoupper(trim((string) $user->dept));
            $q->whereHas('inventory.department', function ($qq) use ($userDept) {
                $qq->whereRaw('UPPER(TRIM(code)) = ?', [$userDept])
                ->orWhereRaw('UPPER(TRIM(name)) = ?', [$userDept]); // fallback if you use name
            });
        }

        return $q->paginate((int) $r->integer('per_page', 20));
    }


    public function myLoans(Request $r)
    {
        $user = $r->user();
        abort_unless($user, 401, 'Unauthenticated.');

        $userId   = $user->id;
        $fallback = $user->name ?: $user->email; // for old rows with no user_id

        $q = Loan::with(['lines.inventoryItem.item', 'inventory'])
            ->where(function ($qq) use ($userId, $fallback) {
                $qq->where('user_id', $userId)
                ->orWhere(function ($q2) use ($fallback) {
                    $q2->whereNull('user_id')
                        ->where('borrower_name', $fallback);
                });
            })
            ->when($r->filled('status'), fn($qq) => $qq->where('status', $r->status))
            ->when($r->filled('dept'), fn($qq) =>
                $qq->whereHas('inventory', fn($q2) => $q2->where('dept', $r->dept))
            )
            ->orderByDesc('id');

        return $q->paginate((int) $r->integer('per_page', 20));
    }

    public function myShow(Request $r, $id)
    {
        $user = $r->user();
        $loan = Loan::with(['lines.inventoryItem.item', 'inventory'])->findOrFail($id);

        // Only owner can see; allow legacy rows by borrower_name match
        $fallback = $user->name ?: $user->email;
        abort_unless(
            ($loan->user_id && $loan->user_id === $user->id) ||
            (!$loan->user_id && $loan->borrower_name === $fallback),
            404
        );

        return $loan;
    }

    public function recent(Request $r) {
        return Loan::with('lines.inventoryItem.item')
            ->orderByDesc('id')->limit(20)->get();
    }

    public function history(Request $r)
    {
        $user = $r->user();
        abort_unless($user, 401, 'Unauthenticated.');

        // caller may pass ?dept=, but facilitators are forced to their own dept
        $dept = $r->string('dept')->toString();
        if (($user->role ?? '') === 'lab_faci') {
            $dept = $user->dept;
        }

        $q = Loan::with(['lines.inventoryItem.item', 'inventory.department'])
            ->orderByDesc('id');

        if ($dept) {
            $deptU = strtoupper(trim($dept));
            // Prefer loan.dept if you have it, otherwise use relation
            $q->where(function ($qq) use ($deptU) {
                $qq->whereRaw('UPPER(TRIM(dept)) = ?', [$deptU])      // if loans.dept is filled
                ->orWhereHas('inventory.department', function ($q2) use ($deptU) {
                    $q2->whereRaw('UPPER(TRIM(code)) = ?', [$deptU])
                        ->orWhereRaw('UPPER(TRIM(name)) = ?', [$deptU]);
                });
            });
        }

        if ($r->filled('who')) {
            $q->where('borrower_name', $r->who);
        }

        return $q->paginate((int) $r->integer('per_page', 20));
    }

    public function store(Request $r)
    {
        $user = $r->user(); // must be auth:sanctum
        $data = $r->validate([
            'inventory_id' => ['required','exists:inventories,id'],
            'borrower_name'=> ['nullable','string','max:255'],
            'due_at'       => ['nullable','date'],
            'lines'        => ['required','array','min:1'],
            'lines.*.inventory_item_id' => ['required','exists:inventory_items,id'],
            'lines.*.qty'  => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $user) {
            $inv = \App\Models\Inventory::with('department')->findOrFail($data['inventory_id']);
            $dept = strtoupper(trim((string)($inv->department?->code ?? $inv->department?->name ?? '')));

            $loan = Loan::create([
                'inventory_id'  => $data['inventory_id'],
                'user_id'       => $user?->id,
                'borrower_name' => $user?->name ?: $user?->email,
                'dept'          => $dept ?: null, // ✅ now correctly filled
                'status'        => Loan::STATUS['PENDING'],
                'requested_at'  => now(),
                'due_at'        => $data['due_at'] ?? null,
            ]);

            foreach ($data['lines'] as $l) {
                LoanLine::create([
                    'loan_id'           => $loan->id,
                    'inventory_item_id' => $l['inventory_item_id'],
                    'qty'               => $l['qty'],
                ]);
            }

            return $loan->load('lines.inventoryItem.item');
        });
    }

    public function approve(Request $r, Loan $loan) {
        $this->guardState($loan, [Loan::STATUS['PENDING']]);

        $loan->update([
            'status'      => Loan::STATUS['APPROVED'],
            'approved_at' => now(),
        ]);
        return $loan->fresh('lines.inventoryItem.item');
    }

    public function decline(Request $r, Loan $loan) {
        $this->guardState($loan, [Loan::STATUS['PENDING']]);
        $data = $r->validate(['decline_reason' => 'required|string|max:2000']);
        $loan->update([
            'status'         => Loan::STATUS['DECLINED'],
            'decline_reason' => $data['decline_reason'],
        ]);
        return response()->noContent();
    }

    public function issue(Request $r, Loan $loan) {
        $this->guardState($loan, [Loan::STATUS['APPROVED']]);

        DB::transaction(function () use ($loan, $r) {
            foreach ($loan->lines as $line) {
                $invItem = $line->inventoryItem()->lockForUpdate()->first();

                // stock check
                if ($invItem->on_hand < $line->qty) {
                    abort(422, "Insufficient stock for {$invItem->item->name}");
                }

                // move out
                $invItem->decrement('on_hand', $line->qty);

                StockMove::create([
                    'inventory_id'      => $loan->inventory_id,
                    'inventory_item_id' => $invItem->id,
                    'qty_change'        => -$line->qty,
                    'reason'            => 'borrow',
                    'ref_type'          => Loan::class,
                    'ref_id'            => $loan->id,
                    'user_id'           => optional($r->user())->id,
                    'happened_at'       => now(),
                ]);
            }

            $loan->update([
                'status'   => Loan::STATUS['OUT'],
                'issued_at'=> now(),
            ]);
        });

        return $loan->fresh('lines.inventoryItem.item');
    }

    // full return of all lines still out
    public function return(Request $r, Loan $loan) {
        $this->guardState($loan, [Loan::STATUS['OUT'], Loan::STATUS['OVERDUE']]);

        DB::transaction(function () use ($loan, $r) {
            foreach ($loan->lines()->whereNull('returned_at')->lockForUpdate()->get() as $line) {
                $this->returnQty($loan, $line, $line->qty, $r);
            }
            $loan->update([
                'status'      => Loan::STATUS['RETURNED'],
                'returned_at' => now(),
            ]);
        });

        return $loan->fresh('lines.inventoryItem.item');
    }

    // partial return per line
    public function returnLine(Request $r, Loan $loan, LoanLine $line) {
        $this->guardState($loan, [Loan::STATUS['OUT'], Loan::STATUS['OVERDUE']]);
        abort_unless($line->loan_id === $loan->id, 404);

        $data = $r->validate(['qty' => 'required|integer|min:1']);
        DB::transaction(function () use ($loan, $line, $data, $r) {
            $this->returnQty($loan, $line, $data['qty'], $r);

            // close loan if everything returned
            $remaining = $loan->lines()->whereNull('returned_at')->count();
            if ($remaining === 0) {
                $loan->update([
                    'status'      => Loan::STATUS['RETURNED'],
                    'returned_at' => now(),
                ]);
            }
        });

        return $loan->fresh('lines.inventoryItem.item');
    }

    private function returnQty(Loan $loan, LoanLine $line, int $qty, Request $r): void {
        $invItem = $line->inventoryItem()->lockForUpdate()->first();

        // cap by outstanding
        $outstanding = $line->qty - ($line->returned_qty ?? 0);
        if ($qty > $outstanding) {
            abort(422, "Return qty exceeds outstanding for line {$line->id}");
        }

        // increment stock back
        $invItem->increment('on_hand', $qty);

        StockMove::create([
            'inventory_id'      => $loan->inventory_id,
            'inventory_item_id' => $invItem->id,
            'qty_change'        => +$qty,
            'reason'            => 'return',
            'ref_type'          => Loan::class,
            'ref_id'            => $loan->id,
            'user_id'           => optional($r->user())->id,
            'happened_at'       => now(),
        ]);

        // track returned
        // either add a returned_qty int column OR close the line at once.
        if (!Schema::hasColumn('loan_lines','returned_qty')) {
            // simple: mark fully returned if equal
            if ($qty === $outstanding) {
                $line->update(['returned_at' => now()]);
            } else {
                // If you need partial tracking, add returned_qty column.
                abort(422, 'Partial returns need loan_lines.returned_qty column.');
            }
        } else {
            $line->increment('returned_qty', $qty);
            if (($line->returned_qty + $qty) >= $line->qty) {
                $line->update(['returned_at' => now()]);
            }
        }
    }

    private function guardState(Loan $loan, array $allowed): void {
        if (!in_array($loan->status, $allowed, true)) {
            abort(409, "Invalid state transition: {$loan->status}");
        }
    }
}

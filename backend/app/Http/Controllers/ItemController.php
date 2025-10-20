<?php
namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;

class ItemController extends Controller
{
    /** Turn a stored path into a public URL (no double-prefixing). */
    private function publicUrl(?string $stored): ?string
    {
        if (!$stored) return null;

        // If it already looks absolute, leave it as-is
        if (preg_match('#^(https?:)?//#i', $stored)) {
            return $stored;
        }

        // Normalize: drop any leading "public/" (if present) and slashes
        $path = ltrim(preg_replace('#^public/#', '', $stored), '/');

        // Base URL for "public" disk
        $base = rtrim(
            config('filesystems.disks.public.url')
            ?? (rtrim(config('app.url'), '/') . '/storage'),
            '/'
        );

        return $base . '/' . $path; // e.g. http://127.0.0.1:8000/storage/items/xxx.jpg
    }

    public function index(Request $request)
    {
        $dept = $request->query('dept');
        $q    = trim((string) $request->query('q', ''));
        $inventoryId = (int) $request->query('inventory_id', 0);
        $query = Item::query()->when($dept, fn ($b) => $b->where('dept', $dept));
        $attachOnly  = (int) $request->query('attach_only', 0);

        if ($q !== '') {
            $tokens = preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY);
            $query->where(function ($w) use ($tokens) {
                foreach ($tokens as $t) {
                    $w->where(function ($x) use ($t) {
                        $driver = config('database.default');
                        $likeOp = in_array(config("database.connections.$driver.driver"), ['pgsql']) ? 'ILIKE' : 'LIKE';
                        $x->where('name', $likeOp, "%{$t}%")
                        ->orWhere('sku', $likeOp, "%{$t}%")
                        ->orWhere('category', $likeOp, "%{$t}%");
                    });
                }
            })->limit(20);
        }

        // NEW: join pivot so we can read per-inventory qty/location
        if ($inventoryId > 0) {
            $query->leftJoin('inventory_items as ii', function ($j) use ($inventoryId) {
                $j->on('ii.item_id','=','items.id')->where('ii.inventory_id',$inventoryId);
            })
            ->addSelect([
                'items.id','items.dept','items.sku','items.name','items.category',
                'items.min','items.description','items.image_url',
                'items.created_at','items.updated_at',
                DB::raw('ii.id as inventory_item_id'),
                DB::raw('ii.inventory_id as inventory_id'),
                DB::raw('COALESCE(ii.on_hand,0) as inv_on_hand'),
                DB::raw('COALESCE(ii.location, items.location) as inv_location'),
            ]);

            if ($attachOnly) {
                // only rows that are actually attached to this inventory
                $query->whereNotNull('ii.item_id');
            }
        }

        $query->withCount([
            'loanLines as borrowed_now' => function ($b) use ($inventoryId) {
                // keep your existing returned filter(s)
                if (Schema::hasColumn('loan_lines', 'returned_at')) {
                    $b->whereNull('returned_at');
                } elseif (Schema::hasColumn('loan_lines', 'is_returned')) {
                    $b->where('is_returned', false);
                } elseif (Schema::hasColumn('loan_lines', 'status')) {
                    $b->whereIn('status', ['approved','out','borrowed','pending']);
                } else {
                    $b->whereRaw('1=0');
                }

                // NEW: when inventory is scoped, only count borrowed in that inventory
                if ($inventoryId > 0) {
                    $b->whereHas('loan', function ($q) use ($inventoryId) {
                        $q->where('inventory_id', $inventoryId);
                    });
                }
            }
        ]);

        $query->with(['batches' => function ($b) {
            $b->select('id','item_id','qty','expires_at')->orderBy('expires_at');
        }])->orderByDesc('items.id');

        $scoped = (int) $request->query('inventory_id', 0) > 0;

        $items = $query->get()->map(function ($it) use ($scoped) {
            $borrowed = (int) ($it->borrowed_now ?? 0);
            $onHand = $scoped ? (int)$it->inv_on_hand : (int)$it->on_hand;
            $loc    = $scoped ? $it->inv_location : $it->location;
            $available= max(0, $onHand - $borrowed);
            $low      = $onHand <= (int)($it->min ?? 0);

            return [
                'id'          => $it->id,
                'dept'        => $it->dept,
                'sku'         => $it->sku,
                'name'        => $it->name,
                'category'    => $it->category,
                'inventory_id'     => $scoped ? (int)($it->inventory_id ?? 0) : null,
                'inventory_item_id'=> $scoped ? (int)($it->inventory_item_id ?? 0) : null,
                'on_hand'     => $onHand,          // pivot when inventory_id is present
                'min'         => (int) ($it->min ?? 0),
                'location'    => $loc,             // pivot when inventory_id is present
                'description' => $it->description,
                'image_url'   => $this->publicUrl($it->image_url),
                'borrowed'    => $borrowed,
                'available'   => $available,
                'low_stock'   => $low,
                'expirations' => $it->batches->map(fn($b) => [
                    'date' => $b->expires_at,
                    'qty'  => (int) $b->qty,
                ])->values(),
            ];
        });

        return response()->json($items);
    }

    public function store(Request $request)
    {
        // 1) Validate
        $validated = $request->validate([
            'item_id'       => 'nullable|integer|exists:items,id',
            'dept'          => 'required|string|max:10',
            'inventory_id'  => 'required|integer|exists:inventories,id',
            'sku'           => 'nullable|string|max:255', // ← changed
            'name'          => ['nullable','string','max:255','required_without:item_id'],
            'category'      => 'nullable|string|max:255',
            'min'           => 'nullable|integer|min:0',
            'location'      => 'nullable|string|max:255',
            'description'   => 'nullable|string',
            'on_hand'       => 'nullable|integer|min:0',
            'batches'       => 'sometimes',
        ]);

        $invId    = (int) $validated['inventory_id'];
        $location = $validated['location'] ?? null;

        if (!empty($validated['item_id'])) {
            // EXISTING: attach stock; never touch SKU
            $item = Item::findOrFail($validated['item_id']);
            $updates = [];
            // only update if actually provided (not null/empty string)
            if ($request->filled('category'))   $updates['category']   = $validated['category'];
            if (array_key_exists('min', $validated)) $updates['min']   = (int)$validated['min'];
            if ($request->filled('location'))   $updates['location']   = $location;
            if ($request->filled('description'))$updates['description']= $validated['description'];

            if (!empty($updates)) {
                $item->fill($updates)->save();
            }
        } else {
            // NEW: create and auto-generate a unique SKU
            $dept = trim((string)$validated['dept']);
            $name = trim((string)($validated['name'] ?? ''));

            // Helper: generate unique SKU with dept prefix
            // Short Crockford Base32 encoder for small integers (e.g., inventory_id)
            $base32 = function (int $n, int $pad = 0): string {
                $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford
                if ($n <= 0) return str_pad('0', $pad, '0', STR_PAD_LEFT);
                $out = '';
                while ($n > 0) {
                    $out = $alphabet[$n % 32] . $out;
                    $n = intdiv($n, 32);
                }
                return $pad > 0 ? str_pad($out, $pad, '0', STR_PAD_LEFT) : $out;
            };

            // 8-char Crockford random
            $genShortCode = function (int $len = 8): string {
                static $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
                $bytes = random_bytes(ceil($len * 5 / 8));
                $bits  = '';
                foreach (str_split($bytes) as $b) $bits .= str_pad(decbin(ord($b)), 8, '0', STR_PAD_LEFT);
                $out = '';
                for ($i = 0; strlen($out) < $len && $i + 5 <= strlen($bits); $i += 5) {
                    $idx = bindec(substr($bits, $i, 5));
                    $out .= $alphabet[$idx];
                }
                return $out;
            };

            // Build inventory tag from the numeric inventory_id (2–3 chars)
            $invTag = $base32((int)$validated['inventory_id'], 2); // e.g., 3 -> "03", 45 -> "1D"

            // Generate a short unique SKU: <DEPT>-<INV>-<CODE>
            $attempts = 0;
            do {
                $code = $genShortCode(8);                            // 8-char random
                $sku  = strtoupper($dept) . '-' . $invTag . '-' . $code; // HTM-A3-9X7F3C2P
                $exists = DB::table('items')->where('sku', $sku)->exists();
                $attempts++;
            } while ($exists && $attempts < 5);

            // Create brand-new item with inventory-referencing SKU
            $item = Item::create([
                'dept'        => $dept,
                'sku'         => $sku,   // e.g., HTM-A3-9X7F3C2P
                'name'        => $name,
                'category'    => $validated['category'] ?? null,
                'min'         => (int)($validated['min'] ?? 0),
                'location'    => $location,
                'description' => $validated['description'] ?? null,
                'image_url'   => $request->input('image_url'),
            ]);
        }

        $hasInvCol = DB::getSchemaBuilder()->hasColumn('item_batches', 'inventory_id');
        // 3) Parse batches FIRST and compute delta from batches (item-level batches)
        $batches = [];
        $deltaFromBatches = 0;

        if ($request->filled('batches')) {
            try {
                $rows = json_decode($request->input('batches'), true, 512, JSON_THROW_ON_ERROR);
                if (is_array($rows)) {
                    foreach ($rows as $row) {
                        $qty = (int)($row['qty'] ?? 0);
                        if ($qty <= 0) continue;

                        // Build payload WITHOUT inventory_id by default
                        $payload = [
                            'item_id'    => $item->id,
                            'qty'        => $qty,
                            'expires_at' => !empty($row['expires_at']) ? $row['expires_at'] : null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        // Only include inventory_id if the column actually exists in your table
                        if ($hasInvCol) {
                            $payload['inventory_id'] = $invId;
                        }

                        $batches[] = $payload;
                        $deltaFromBatches += $qty;
                    }
                }
            } catch (\Throwable $e) {
                // Optional: return a 422 so the UI shows a clean error
                // return response()->json(['message' => 'Invalid batches JSON'], 422);
            }
        }


        // 4) Decide the one true delta: batches win if provided
        $deltaBody   = (int)($validated['on_hand'] ?? 0);
        $totalDelta  = $deltaFromBatches > 0 ? $deltaFromBatches : $deltaBody;

        DB::transaction(function () use ($item, $invId, $location, $batches, $totalDelta) {
            // 5) Update the pivot ONCE (no upsert-then-add). Lock to prevent races.
            $ii = DB::table('inventory_items')
                ->lockForUpdate()
                ->where(['inventory_id' => $invId, 'item_id' => $item->id])
                ->first();

            if (!$ii) {
                DB::table('inventory_items')->insert([
                    'inventory_id' => $invId,
                    'item_id'      => $item->id,
                    'on_hand'      => max(0, $totalDelta),
                    'location'     => $location,
                    'status'       => 'ok',        // keep your default status
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            } else {
                DB::table('inventory_items')
                    ->where(['inventory_id' => $invId, 'item_id' => $item->id])
                    ->update([
                        'on_hand'    => DB::raw('GREATEST(0, on_hand + '.((int)$totalDelta).')'),
                        'location'   => $location,
                        'updated_at' => now(),
                    ]);
            }

            // 6) Insert batches AFTER pivot update (no extra on_hand math here)
            if (!empty($batches)) {
                DB::table('item_batches')->insert($batches);
            }
        });

        if ($request->hasFile('image')) {
            // delete old file if you want one-image-per-item
        if (!empty($item->getRawOriginal('image_url'))) {
            $oldRel = preg_replace('#^public/#', '', (string)$item->getRawOriginal('image_url'));
            Storage::disk('public')->delete($oldRel);
        }
        $stored = $request->file('image')->store('items', 'public'); // items/xxxx.webp
        $item->image_url = $stored; // keep DB value as storage path
        $item->save();
}

        // 7) Return the fresh row with correct on_hand and expirations
        $ii = DB::table('inventory_items')
            ->where(['inventory_id' => $invId, 'item_id' => $item->id])
            ->first();

        $expirations = DB::table('item_batches')
            ->select(['expires_at as date', 'qty'])
            ->where('item_id', $item->id)
            ->when($hasInvCol, fn($q) => $q->where('inventory_id', $invId))
            ->orderBy('expires_at')
            ->get();

        return response()->json([
            'id'          => $item->id,
            'dept'        => $item->dept,
            'sku'         => $item->sku,
            'name'        => $item->name,
            'category'    => $item->category,
            'min'         => (int)($item->min ?? 0),
            'description' => $item->description,
            'image_url'   => $item->image_url,
            'on_hand'     => (int)($ii->on_hand ?? 0),
            'location'    => $ii->location ?? $item->location,
            'expirations' => $expirations,
        ], $item->wasRecentlyCreated ? 201 : 200);
    }


    public function update(Request $req, Item $item)
    {
        $validated = $req->validate([
            'dept'         => 'sometimes|string',
            'inventory_id' => 'sometimes|integer|exists:inventories,id',  // NEW
            'sku'          => ['sometimes','string','max:64', Rule::unique('items','sku')->ignore($item->id)],
            'name'         => 'sometimes|string|max:255',
            'min'          => 'sometimes|integer|min:0',
            'category'     => 'sometimes|nullable|string|max:255',
            'description'  => 'sometimes|nullable|string',
            'location'     => 'sometimes|nullable|string', // may be pivot or catalog
            'on_hand'      => 'sometimes|integer|min:0',   // pivot field
            'image'        => 'sometimes|image',
        ]);

        return DB::transaction(function () use ($req, $item, $validated) {
            $invId = (int)($validated['inventory_id'] ?? 0);

            $wantsPivotChange = $invId > 0 && (
                array_key_exists('on_hand', $validated) ||
                array_key_exists('location', $validated)
            );

            // 1) Pivot update (per inventory) for stock/location
            if ($wantsPivotChange && Schema::hasTable('inventory_items')) {
                $updates = ['updated_at'=>now()];
                if (array_key_exists('on_hand', $validated)) {
                    $updates['on_hand'] = (int)$validated['on_hand'];
                }
                if (array_key_exists('location', $validated)) {
                    $updates['location'] = $validated['location'];
                }

                DB::table('inventory_items')->upsert(
                    [[
                        'inventory_id' => $invId,
                        'item_id'      => $item->id,
                        'on_hand'      => (int)($validated['on_hand'] ?? 0),
                        'location'     => $validated['location'] ?? null,
                        'status'       => 'ok',
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]],
                    ['inventory_id','item_id'],
                    array_keys($updates)
                );

                DB::table('inventory_items')->where([
                    'inventory_id'=>$invId, 'item_id'=>$item->id
                ])->update($updates);
            }

            // 2) Catalog update for identity/metadata
            $catalogFields = ['dept','sku','name','category','min','description'];
            $dirty = false;
            foreach ($catalogFields as $f) {
                if (array_key_exists($f, $validated)) { $item->{$f} = $validated[$f]; $dirty = true; }
            }

            if ($req->hasFile('image')) {
                if (!empty($item->getRawOriginal('image_url'))) {
                    $oldPath = preg_replace('#^public/#', '', $item->getRawOriginal('image_url'));
                    Storage::disk('public')->delete($oldPath);
                }
                $item->image_url = $req->file('image')->store('items', 'public');
                $dirty = true;
            }

            if ($dirty) $item->save();

            // Merge view
            $ii = $invId
                ? DB::table('inventory_items')->where(['inventory_id'=>$invId,'item_id'=>$item->id])->first()
                : null;

            return response()->json([
                'id'          => $item->id,
                'dept'        => $item->dept,
                'sku'         => $item->sku,
                'name'        => $item->name,
                'category'    => $item->category,
                'min'         => (int)($item->min ?? 0),
                'description' => $item->description,
                'image_url'   => $this->publicUrl($item->image_url),
                'on_hand'     => (int)($ii->on_hand ?? $item->on_hand ?? 0),
                'location'    => $ii->location ?? $item->location,
            ]);
        });
    }

    public function destroy(Item $item)
    {
        try {
            DB::transaction(function () use ($item) {
                // Collect all inventory_item ids for this item
                $invItemIds = DB::table('inventory_items')
                    ->where('item_id', $item->id)
                    ->pluck('id');

                // Delete loan lines that reference those pivot rows
                if ($invItemIds->isNotEmpty()) {
                    DB::table('loan_lines')
                        ->whereIn('inventory_item_id', $invItemIds->all())
                        ->delete();

                    // Delete stock moves that reference those pivot rows (polymorphic)
                    // stock_moves.ref_type = 'inventory_item' AND ref_id IN (<pivot ids>)
                    DB::table('stock_moves')
                        ->where('ref_type', 'inventory_item')
                        ->whereIn('ref_id', $invItemIds->all())
                        ->delete();
                }

                // Delete item-level batches (and optionally scoped-to-inventory if you added that column)
                DB::table('item_batches')->where('item_id', $item->id)->delete();

                // Delete the pivots themselves
                DB::table('inventory_items')->where('item_id', $item->id)->delete();

                // (Incidents, etc.) — only if they really belong to the item table directly
                if (method_exists($item, 'incidents')) {
                    $item->incidents()->delete();
                }

                // Delete stored image using RAW DB value (not accessor URL)
                $raw = (string) $item->getRawOriginal('image_url');
                if ($raw !== '') {
                    $path = ltrim(preg_replace('#^public/#','', $raw), '/');
                    Storage::disk('public')->delete($path);
                }

                // Finally delete the item (no soft-deletes)
                $item->delete();
            });

            return response()->noContent(); // 204
        } catch (\Throwable $e) {
            Log::error('Delete item failed', [
                'item_id' => $item->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Unable to delete item. It may have related borrow/stock records.',
            ], 409);
        }
    }

}

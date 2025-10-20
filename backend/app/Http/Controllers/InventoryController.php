<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{Inventory, Department};

class InventoryController extends Controller
{
    // GET /api/inventories?dept=HTM OR ?department_id=1
    public function index(Request $req)
    {
        $q = Inventory::query();

        if ($req->filled('department_id')) {
            $q->where('department_id', (int) $req->query('department_id'));
        } elseif ($req->filled('dept')) {
            $dept = Department::where('code', $req->query('dept'))
                ->orWhere('name', $req->query('dept'))
                ->first();
            if (!$dept) {
                // choose 200 [] or 422 — here we return empty list
                return response()->json([]);
            }
            $q->where('department_id', $dept->id);
        }

        $data = $q->orderBy('name')->get()->map(fn($inv) => [
            'id'   => $inv->id,
            'name' => $inv->name,
            'kpis' => [
                'totalItems'=>0,'borrowedNow'=>0,'lowStock'=>0,'incidentsOpen'=>0,'upcomingAudits'=>0,
            ],
        ]);

        return response()->json($data);
    }

    // POST /api/inventories  { "name":"Lab A", "dept":"HTM" }  or  { "name":"Lab A", "department_id":1 }
    public function store(Request $req)
    {
        $data = $req->validate([
            'name'          => 'required|string|max:80',
            'dept'          => 'nullable|string|max:20',
            'department_id' => 'nullable|integer',
        ]);

        // Resolve department_id (required because DB column is NOT NULL)
        $departmentId = null;

        if (!empty($data['department_id'])) {
            $departmentId = Department::whereKey($data['department_id'])->value('id');
            if (!$departmentId) {
                return response()->json(['message' => 'Invalid department_id'], 422);
            }
        } elseif (!empty($data['dept'])) {
            $dept = Department::where('code', $data['dept'])
                    ->orWhere('name', $data['dept'])
                    ->first();
            if (!$dept) {
                return response()->json(['message' => 'Unknown department code'], 422);
            }
            $departmentId = $dept->id;
        } else {
            return response()->json(['message' => 'Provide dept or department_id'], 422);
        }

        // Optional: enforce unique name per department
        $exists = Inventory::where('department_id', $departmentId)
            ->where('name', $data['name'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'Inventory name already exists in this department'], 422);
        }

        $inv = Inventory::create([
            'department_id' => $departmentId,
            'name'          => $data['name'],
        ]);

        return response()->json([
            'id'   => $inv->id,
            'name' => $inv->name,
            'kpis' => [
                'totalItems'=>0,'borrowedNow'=>0,'lowStock'=>0,'incidentsOpen'=>0,'upcomingAudits'=>0,
            ],
        ], 201);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();
        return response()->json(null, 204);
    }
}

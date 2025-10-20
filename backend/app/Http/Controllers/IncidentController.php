<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{Inventory, Item, InventoryItem, Incident};
use Illuminate\Support\Facades\DB;

class IncidentController extends Controller
{
    // GET /api/incidents?dept=HTM
    public function index(Request $req)
    {
        $dept = $req->query('dept');
        $inv = Inventory::whereHas('department', fn($q)=>$q->where('code',$dept))->first();
        if (!$inv) return response()->json([]);
        $rows = Incident::with('item')->where('inventory_id',$inv->id)->orderByDesc('id')->get()->map(fn($r)=>[
            'item'=>$r->item->name, 'qty'=>(int)$r->qty, 'remark'=>$r->remark, 'tag'=>$r->tag
        ]);
        return response()->json($rows);
    }

    // POST /api/incidents { dept, sku, qty, tag, remark }
    public function store(Request $req)
    {
        $data = $req->validate([
            'dept'=>'required|in:HTM,PE,SCI,ICT',
            'sku'=>'required|string',
            'qty'=>'required|integer|min:1',
            'tag'=>'required|string|max:60',
            'remark'=>'nullable|string|max:255',
        ]);

        $inv = Inventory::whereHas('department', fn($q)=>$q->where('code',$data['dept']))->firstOrFail();
        $item = \App\Models\Item::where('sku',$data['sku'])->firstOrFail();

        DB::transaction(function() use ($inv,$item,$data){
            Incident::create([
                'inventory_id'=>$inv->id, 'item_id'=>$item->id, 'qty'=>$data['qty'],
                'tag'=>$data['tag'], 'remark'=>$data['remark'] ?? null, 'status'=>'open','reported_at'=>now(),
            ]);
            // optional stock deduction:
            $ii = \App\Models\InventoryItem::where('inventory_id',$inv->id)
                ->where('item_id',$item->id)
                ->lockForUpdate()
                ->first();
            if (!$ii) {
              $ii = \App\Models\InventoryItem::create([
                'inventory_id'=>$inv->id, 'item_id'=>$item->id, 'on_hand'=>0, 'status'=>'ok', 'location'=>null
              ]);
            }
            $ii->on_hand = max(0, $ii->on_hand - $data['qty']);});

        return response()->json(['ok'=>true], 201);
    }
}

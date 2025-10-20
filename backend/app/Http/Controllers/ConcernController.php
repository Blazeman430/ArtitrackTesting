<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{Department, Concern, Item};

class ConcernController extends Controller
{
    // GET /api/concerns?dept=HTM
    public function index(Request $req)
    {
        $dept = $req->query('dept');
        $department = \App\Models\Department::where('code',$dept)->first();
        if (!$department) return response()->json([]);
        $rows = Concern::where('department_id',$department->id)->orderByDesc('id')->get()->map(fn($c)=>[
            'id'=>"C-{$c->id}",
            'date'=>$c->created_at->format('Y-m-d'),
            'from'=>$c->from_name ?? 'User',
            'item'=>optional($c->item)->name,
            'type'=>$c->type,
            'message'=>$c->message,
            'status'=>$c->status,
        ]);
        return response()->json($rows);
    }

    // POST /api/concerns { dept, from, item_sku?, type, message }
    public function store(Request $req)
    {
        $data = $req->validate([
            'dept'=>'required|in:HTM,PE,SCI,ICT',
            'from'=>'required|string|max:160',
            'item_sku'=>'nullable|string',
            'type'=>'required|in:Concern,Suggestion',
            'message'=>'required|string',
        ]);
        $dep = \App\Models\Department::where('code',$data['dept'])->firstOrFail();
        $item = isset($data['item_sku']) ? \App\Models\Item::where('sku',$data['item_sku'])->first() : null;

        $c = Concern::create([
            'department_id'=>$dep->id,
            'from_name'=>$data['from'],
            'item_id'=> $item?->id,
            'type'=>$data['type'],
            'message'=>$data['message'],
            'status'=>'open',
        ]);
        return response()->json(['id'=>$c->id], 201);
    }
}

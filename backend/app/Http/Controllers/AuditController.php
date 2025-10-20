<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{Inventory, Audit};

class AuditController extends Controller
{
    // GET /api/audits?dept=HTM
    public function index(Request $req)
    {
        $dept = $req->query('dept');
        $inv = Inventory::whereHas('department', fn($q)=>$q->where('code',$dept))->first();
        if (!$inv) return response()->json([]);
        $rows = Audit::where('inventory_id',$inv->id)->orderByDesc('id')->get()->map(fn($a)=>[
            'date'=> ($a->scheduled_for ? $a->scheduled_for->format('Y-m-d') : $a->created_at->format('Y-m-d')),
            'status'=> $a->status,
            'ack'=> $a->ack_at ? ['by'=>$a->ack_by_name ?? 'Custodian', 'at'=>$a->ack_at->format('Y-m-d'), 'note'=>$a->ack_note] : null,
        ]);
        return response()->json($rows);
    }

    // POST /api/audits  { dept, date }
    public function schedule(Request $req)
    {
        $data = $req->validate([
            'dept'=>'required|in:HTM,PE,SCI,ICT',
            'date'=>'required|date',
        ]);
        $inv = Inventory::whereHas('department', fn($q)=>$q->where('code',$data['dept']))->firstOrFail();
        Audit::create([
            'inventory_id'=>$inv->id,
            'scheduled_for'=>$data['date'],
            'status'=>'Scheduled',
        ]);
        return response()->json(['ok'=>true], 201);
    }

    public function acknowledge(Audit $audit, Request $req)
    {
        $audit->update([
            'status'=>'Completed',
            'ack_at'=>now(),
            'ack_by_name'=>'Custodian',
            'ack_note'=>$req->input('note')
        ]);
        return response()->json(['ok'=>true]);
    }

    public function requestRevision(Audit $audit, Request $req)
    {
        $audit->update([
            'status'=>'Needs Revision',
            'ack_note'=>$req->input('reason')
        ]);
        return response()->json(['ok'=>true]);
    }
}

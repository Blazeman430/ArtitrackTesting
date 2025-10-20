<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AuditLine extends Model
{
    use HasFactory;

    protected $fillable = ['audit_id','item_id','system_qty','counted_qty','variance','note'];
    protected $casts = ['system_qty'=>'integer','counted_qty'=>'integer','variance'=>'integer'];

    public function audit() { return $this->belongsTo(Audit::class); }
    public function item()  { return $this->belongsTo(Item::class); }
}

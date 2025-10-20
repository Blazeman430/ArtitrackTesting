<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_id','item_id','qty','tag','remark','status','reported_at','resolved_at'
    ];
    protected $casts = ['qty'=>'integer','reported_at'=>'datetime','resolved_at'=>'datetime'];

    public function inventory() { return $this->belongsTo(Inventory::class); }
    public function item()      { return $this->belongsTo(Item::class); }
}

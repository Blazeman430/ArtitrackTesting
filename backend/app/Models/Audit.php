<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_id','scheduled_for','status','submitted_by_name','submitted_at',
        'ack_by_name','ack_at','ack_note'
    ];
    protected $casts = ['scheduled_for'=>'date','submitted_at'=>'datetime','ack_at'=>'datetime'];

    public function inventory() { return $this->belongsTo(Inventory::class); }
    public function lines()     { return $this->hasMany(AuditLine::class); }
}

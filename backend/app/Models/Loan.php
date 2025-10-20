<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $fillable = [
        'inventory_id','user_id','borrower_name','dept',
        'status','decline_reason','requested_at','approved_at',
        'issued_at','due_at','returned_at'
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at'  => 'datetime',
        'issued_at'    => 'datetime',
        'due_at'       => 'datetime',
        'returned_at'  => 'datetime',
    ];

    public const STATUS = [
        'PENDING'  => 'pending',
        'APPROVED' => 'approved',
        'DECLINED' => 'declined',
        'OUT'      => 'out',
        'RETURNED' => 'returned',
        'OVERDUE'  => 'overdue',
    ];

    public function lines() {
        return $this->hasMany(LoanLine::class);
    }

    public function inventory() {
        return $this->belongsTo(Inventory::class);
    }

    public function scopeActive($q) {
        return $q->whereIn('status',[self::STATUS['PENDING'], self::STATUS['APPROVED'], self::STATUS['OUT']]);
    }

    public function isCompleted(): bool {
        return $this->status === self::STATUS['RETURNED'];
    }
}

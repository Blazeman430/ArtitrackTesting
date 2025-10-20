<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = ['department_id','name'];
    
    public function getDeptAttribute()
    {
        // assumes departments table has a "code" column (e.g., HTM, PE, SCI)
        return $this->department?->code ?? $this->department?->name ?? null;
    }
    public function department()     { return $this->belongsTo(Department::class); }
    public function inventoryItems() { return $this->hasMany(InventoryItem::class); }
    public function loans()          { return $this->hasMany(Loan::class); }
    public function incidents()      { return $this->hasMany(Incident::class); }
    public function audits()         { return $this->hasMany(Audit::class); }
    public function stockMoves()     { return $this->hasMany(StockMove::class); }
}

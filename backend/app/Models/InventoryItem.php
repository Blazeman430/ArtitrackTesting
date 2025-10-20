<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = ['inventory_id','item_id','on_hand','status','location'];
    protected $casts = ['on_hand'=>'integer'];

    public function inventory() { return $this->belongsTo(Inventory::class); }
    
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}

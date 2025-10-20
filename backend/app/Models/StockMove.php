<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMove extends Model
{
    protected $fillable = [
        'inventory_id','inventory_item_id','qty_change','reason',
        'ref_type','ref_id','user_id','happened_at'
    ];

    protected $casts = ['happened_at' => 'datetime'];

    public function inventoryItem() {
        return $this->belongsTo(InventoryItem::class);
    }
}

<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanLine extends Model
{
    protected $fillable = ['loan_id','inventory_item_id','qty','returned_at'];

    protected $casts = [
        'returned_at' => 'datetime',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function item()
    {
        // reach Item through InventoryItem
        return $this->hasOneThrough(
            Item::class,
            InventoryItem::class,
            'id',        // InventoryItem primary key
            'id',        // Item primary key
            'inventory_item_id', // FK on loan_lines -> inventory_items.id
            'item_id'    // FK on inventory_items -> items.id
        );
    }
}

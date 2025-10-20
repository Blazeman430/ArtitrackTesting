<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemBatch extends Model
{
    use HasFactory;

    // This model naturally maps to "item_batches"
    protected $fillable = ['item_id', 'qty', 'expires_at'];
    protected $casts = [
        'qty' => 'integer',
        'expires_at' => 'date:Y-m-d',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}

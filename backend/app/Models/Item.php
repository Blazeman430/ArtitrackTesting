<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    use HasFactory;

    // app/Models/Item.php
    protected $fillable = ['sku','name','category','min','image_url','on_hand','dept','location','description'];    
    protected $casts = ['min'=>'integer'];

    public function batches() {
        return $this->hasMany(ItemBatch::class); // make model ItemBatch
    }

    public static function makeSku(?string $dept, ?string $category, ?string $name): string
    {
        $dept = strtoupper($dept ?: 'GEN');

        // 3-char tag from category or name, alnum only
        $tag = strtoupper(substr(preg_replace('/[^A-Z0-9]/i', '', $category ?: $name ?: 'ITEM'), 0, 3) ?: 'GEN');

        // time-based base36 (millis) + 2 random letters -> short & diverse
        $base36 = strtoupper(base_convert((int) (microtime(true) * 1000), 10, 36)); // e.g. MBW9G
        $rand   = strtoupper(Str::random(2));                                       // e.g. 7K

        $sku = "{$dept}-{$tag}-{$base36}-{$rand}";                                  // HTM-SPO-MBW9G-7K

        // guarantee uniqueness
        while (self::where('sku', $sku)->exists()) {
            $rand = strtoupper(Str::random(2));
            $sku  = "{$dept}-{$tag}-{$base36}-{$rand}";
        }
        return $sku;
    }

    public function getImageUrlAttribute($value)
    {
        if (!$value) return null;

        // DB should store "items/abc.jpg" or "public/items/abc.jpg"
        $path = ltrim(preg_replace('#^public/#', '', $value), '/');

        // If Storage::disk('public')->url() is not available, use asset() as fallback
        return asset('storage/' . $path); // -> http://127.0.0.1:8000/storage/items/abc.jpg
    }

    public function inventoryItems()
    {
        // inventory_items.item_id -> items.id
        return $this->hasMany(InventoryItem::class, 'item_id', 'id');
    }
    
    public function loanLines()
    {
        // Item -> InventoryItem -> LoanLine
        // inventory_items.item_id            matches items.id
        // loan_lines.inventory_item_id       matches inventory_items.id
        return $this->hasManyThrough(
            LoanLine::class,          // final
            InventoryItem::class,     // through
            'item_id',                // FK on InventoryItem -> Item
            'inventory_item_id',      // FK on LoanLine -> InventoryItem
            'id',                     // local key on Item
            'id'                      // local key on InventoryItem
        );
    }
    public function incidents()      { return $this->hasMany(Incident::class); }
    
}

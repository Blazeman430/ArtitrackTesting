<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['code','name'];

    public function inventories() { return $this->hasMany(Inventory::class); }
    public function concerns()    { return $this->hasMany(Concern::class); }
}

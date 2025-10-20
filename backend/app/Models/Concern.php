<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Concern extends Model
{
    use HasFactory;

    protected $fillable = ['department_id','from_name','item_id','type','message','status'];

    public function department() { return $this->belongsTo(Department::class); }
    public function item()       { return $this->belongsTo(Item::class); }
}

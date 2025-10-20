<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('inventory_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $t->foreignId('item_id')->constrained()->cascadeOnDelete();
            $t->integer('on_hand')->default(0);
            $t->string('status', 12)->default('ok'); // ok/low
            $t->string('location')->nullable();
            $t->timestamps();
            $t->unique(['inventory_id','item_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('inventory_items');
    }
};

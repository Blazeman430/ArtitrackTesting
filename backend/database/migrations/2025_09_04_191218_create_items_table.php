<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('items', function (Blueprint $t) {
            $t->id();
            $t->string('sku', 64)->unique();
            $t->string('name');
            $t->string('category')->nullable();
            $t->integer('min')->default(0);
            $t->string('image_url')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('items');
    }
};

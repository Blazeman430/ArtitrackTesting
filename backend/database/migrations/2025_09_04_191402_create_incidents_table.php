<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('incidents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $t->foreignId('item_id')->constrained()->cascadeOnDelete();
            $t->integer('qty');
            $t->string('tag'); // Broken, Expired...
            $t->string('remark')->nullable();
            $t->string('status', 20)->default('open')->index();
            $t->timestamp('reported_at')->useCurrent();
            $t->timestamp('resolved_at')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('incidents');
    }
};

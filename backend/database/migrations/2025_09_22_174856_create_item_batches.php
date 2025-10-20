<?php

// database/migrations/2025_09_23_000002_create_item_batches.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('item_batches', function (Blueprint $t) {
      $t->id();
      $t->foreignId('item_id')->constrained('items')->cascadeOnDelete();
      $t->unsignedInteger('qty')->default(0);
      $t->date('expires_at')->nullable();  // supports non-perishable (null)
      $t->timestamps();
      $t->index(['item_id','expires_at']);
    });
  }
  public function down(): void {
    Schema::dropIfExists('item_batches');
  }
};


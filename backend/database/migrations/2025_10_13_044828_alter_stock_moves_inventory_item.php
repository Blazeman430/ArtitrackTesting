<?php

// database/migrations/2025_10_13_000002_alter_stock_moves_inventory_item.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('stock_moves', function (Blueprint $t) {
      if (Schema::hasColumn('stock_moves','item_id')) {
        $t->dropConstrainedForeignId('item_id');
      }
      if (!Schema::hasColumn('stock_moves','inventory_item_id')) {
        $t->foreignId('inventory_item_id')
          ->after('inventory_id')
          ->constrained('inventory_items')
          ->cascadeOnDelete();
      }
      // Optional: enforce consistency
      $t->unique(['inventory_id','inventory_item_id','id'],'stock_moves_consistency_idx');
    });
  }
  public function down(): void {
    Schema::table('stock_moves', function (Blueprint $t) {
      if (Schema::hasColumn('stock_moves','inventory_item_id')) {
        $t->dropConstrainedForeignId('inventory_item_id');
      }
      $t->foreignId('item_id')->constrained()->cascadeOnDelete();
      $t->dropUnique('stock_moves_consistency_idx');
    });
  }
};

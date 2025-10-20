<?php

// database/migrations/2025_10_13_000001_alter_loan_lines_inventory_item.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('loan_lines', function (Blueprint $t) {
      if (Schema::hasColumn('loan_lines', 'item_id')) {
        $t->dropConstrainedForeignId('item_id');
      }
      if (!Schema::hasColumn('loan_lines', 'inventory_item_id')) {
        $t->foreignId('inventory_item_id')->after('loan_id')
          ->constrained('inventory_items')->cascadeOnDelete();
      }
    });
  }
  public function down(): void {
    Schema::table('loan_lines', function (Blueprint $t) {
      if (Schema::hasColumn('loan_lines', 'inventory_item_id')) {
        $t->dropConstrainedForeignId('inventory_item_id');
      }
      $t->foreignId('item_id')->constrained('items')->cascadeOnDelete();
    });
  }
};


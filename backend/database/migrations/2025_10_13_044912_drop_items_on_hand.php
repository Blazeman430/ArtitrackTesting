<?php

// database/migrations/2025_10_13_000003_drop_items_on_hand.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('items', function (Blueprint $t) {
      if (Schema::hasColumn('items','on_hand')) {
        $t->dropColumn('on_hand');
      }
    });
  }
  public function down(): void {
    Schema::table('items', function (Blueprint $t) {
      if (!Schema::hasColumn('items','on_hand')) {
        $t->integer('on_hand')->default(0);
      }
    });
  }
};


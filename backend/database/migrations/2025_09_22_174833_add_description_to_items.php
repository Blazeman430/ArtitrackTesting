<?php
// database/migrations/2025_09_23_000001_add_description_to_items.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('items', function (Blueprint $t) {
      if (!Schema::hasColumn('items', 'description')) {
        $t->text('description')->nullable()->after('location');
      }
    });
  }
  public function down(): void {
    Schema::table('items', function (Blueprint $t) {
      if (Schema::hasColumn('items', 'description')) $t->dropColumn('description');
    });
  }
};


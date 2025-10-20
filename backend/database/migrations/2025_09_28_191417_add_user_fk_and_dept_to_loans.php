<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('loans', function (Blueprint $t) {
      if (!Schema::hasColumn('loans', 'user_id')) {
        $t->foreignId('user_id')->nullable()->constrained('users')
          ->cascadeOnUpdate()->nullOnDelete()->index();
      }
      if (!Schema::hasColumn('loans', 'dept')) {
        $t->string('dept', 16)->nullable()->index(); // HTM|PE|SCI|ICT
      }
      // you already have requested_at/returned_at/status in your model; keep them
    });
  }

  public function down(): void {
    Schema::table('loans', function (Blueprint $t) {
      if (Schema::hasColumn('loans', 'user_id')) $t->dropConstrainedForeignId('user_id');
      if (Schema::hasColumn('loans', 'dept')) $t->dropColumn('dept');
    });
  }
};

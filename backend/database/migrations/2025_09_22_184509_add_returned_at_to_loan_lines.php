<?php
// database/migrations/2025_09_23_000003_add_returned_at_to_loan_lines.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('loan_lines', function (Blueprint $t) {
      if (!Schema::hasColumn('loan_lines','returned_at')) {
        $t->timestamp('returned_at')->nullable()->index();
      }
    });
  }
  public function down(): void {
    Schema::table('loan_lines', function (Blueprint $t) {
      if (Schema::hasColumn('loan_lines','returned_at')) {
        $t->dropColumn('returned_at');
      }
    });
  }
};


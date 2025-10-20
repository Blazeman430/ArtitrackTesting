<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Unique on (dept, name, COALESCE(category,''), COALESCE(location,''))
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS items_dedupe_unique
            ON items (dept, name, COALESCE(category,''), COALESCE(location,''))
        ");
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS items_dedupe_unique");
    }
};

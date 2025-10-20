<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('items', function (Blueprint $t) {
            if (!Schema::hasColumn('items', 'dept')) {
                $t->string('dept', 16)->after('id');
            }
            if (!Schema::hasColumn('items', 'location')) {
                $t->string('location')->nullable()->after('category');
            }
            if (!Schema::hasColumn('items', 'on_hand')) {
                $t->unsignedInteger('on_hand')->default(0)->after('location');
            }
            if (Schema::hasColumn('items', 'image_url')) {
                $t->string('image_url', 2048)->nullable()->change();
            }
        });

        DB::statement("
          CREATE UNIQUE INDEX IF NOT EXISTS items_dedupe_unique
          ON items (dept, name, COALESCE(category,''), COALESCE(location,''))
        ");
    }

    public function down(): void {
        DB::statement("DROP INDEX IF EXISTS items_dedupe_unique");
        Schema::table('items', function (Blueprint $t) {
            // If you need a strict down, you can drop columns here.
            // Usually you can leave them since data would be lost.
        });
    }
};

<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // department code used by your UI (HTM/PE/SCI/ICT)
            $table->string('dept', 10)->nullable()->index();

            // stock/location fields your UI sends/reads
            $table->integer('on_hand')->default(0);
            $table->string('location', 255)->nullable();
            $table->date('acquired_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['dept', 'on_hand', 'location', 'acquired_at']);
        });
    }
};

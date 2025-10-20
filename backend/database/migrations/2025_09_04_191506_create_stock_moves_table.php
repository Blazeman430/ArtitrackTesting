<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('stock_moves', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $t->foreignId('item_id')->constrained()->cascadeOnDelete();
            $t->integer('qty_change'); // +in / -out
            $t->string('reason', 32); // receive/borrow/return/adjust/incident/audit_correction/transfer_in/transfer_out/dispose
            $t->string('ref_type')->nullable();
            $t->unsignedBigInteger('ref_id')->nullable();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('happened_at')->index();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('stock_moves');
    }
};

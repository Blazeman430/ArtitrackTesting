<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('loans', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $t->string('borrower_name'); // simple text for now
            $t->string('status', 20)->index(); // pending/approved/declined/out/returned/overdue
            $t->text('decline_reason')->nullable();
            $t->timestamp('requested_at')->nullable();
            $t->timestamp('approved_at')->nullable();
            $t->timestamp('issued_at')->nullable();
            $t->timestamp('due_at')->nullable();
            $t->timestamp('returned_at')->nullable();
            $t->timestamps();
        });

        Schema::create('loan_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $t->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $t->integer('qty');
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('loan_lines');
        Schema::dropIfExists('loans');
    }
};

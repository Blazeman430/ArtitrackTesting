<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('audits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $t->date('scheduled_for')->nullable();
            $t->string('status', 24)->index(); // Scheduled/In progress/Submitted/Completed/Needs Revision
            $t->string('submitted_by_name')->nullable();
            $t->timestamp('submitted_at')->nullable();
            $t->string('ack_by_name')->nullable();
            $t->timestamp('ack_at')->nullable();
            $t->string('ack_note')->nullable();
            $t->timestamps();
        });

        Schema::create('audit_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('audit_id')->constrained('audits')->cascadeOnDelete();
            $t->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $t->integer('system_qty');
            $t->integer('counted_qty');
            $t->integer('variance');
            $t->string('note')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('audit_lines');
        Schema::dropIfExists('audits');
    }
};

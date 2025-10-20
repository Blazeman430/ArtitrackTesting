<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('concerns', function (Blueprint $t) {
            $t->id();
            $t->foreignId('department_id')->constrained()->cascadeOnDelete();
            $t->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $t->string('from_name');
            $t->string('type', 16)->default('Concern'); // Concern/Suggestion
            $t->text('message');
            $t->string('status', 16)->default('open')->index();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('concerns');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('departments', function (Blueprint $t) {
            $t->id();
            $t->string('code', 8)->unique(); // HTM, PE, SCI, ICT
            $t->string('name');
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('departments');
    }
};

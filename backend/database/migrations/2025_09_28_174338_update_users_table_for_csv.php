<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) {
            // Drop password + auth leftovers
            if (Schema::hasColumn('users', 'password')) {
                $t->dropColumn('password');
            }
            if (Schema::hasColumn('users', 'remember_token')) {
                $t->dropColumn('remember_token');
            }
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $t->dropColumn('email_verified_at');
            }

            // Add CSV-related columns if not already present
            if (!Schema::hasColumn('users', 'role')) {
                $t->string('role', 32)->nullable()->index();
            }
            if (!Schema::hasColumn('users', 'dept')) {
                $t->string('dept', 16)->nullable()->index();
            }
            if (!Schema::hasColumn('users', 'account_no')) {
                $t->string('account_no', 64)->nullable()->index();
            }
            if (!Schema::hasColumn('users', 'photo_url')) {
                $t->string('photo_url')->nullable();
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $t->boolean('is_active')->default(true)->index();
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $t->timestamp('last_login_at')->nullable()->index();
            }
            if (!Schema::hasColumn('users', 'source')) {
                $t->string('source', 16)->nullable()->index();
            }
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            // Rollback = add password back if needed
            $t->string('password')->nullable();
            $t->rememberToken();
            $t->timestamp('email_verified_at')->nullable();
            $t->dropColumn(['role','dept','account_no','photo_url','is_active','last_login_at','source']);
        });
    }
};

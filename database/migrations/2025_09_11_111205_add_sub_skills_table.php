<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if column doesn't exist before adding it
        if (!Schema::hasColumn('skills', 'sub_skills')) {
            Schema::table('skills', function (Blueprint $table) {
                $table->json('sub_skills')->nullable()->after('skill_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if column exists before dropping it
        if (Schema::hasColumn('skills', 'sub_skills')) {
            Schema::table('skills', function (Blueprint $table) {
                $table->dropColumn('sub_skills');
            });
        }
    }
};
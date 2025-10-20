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
        Schema::table('jobposts', function (Blueprint $table) {
            $table->integer('team_size')->nullable()->after('hiring_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobposts', function (Blueprint $table) {
            $table->dropColumn('team_size');
        });
    }
};
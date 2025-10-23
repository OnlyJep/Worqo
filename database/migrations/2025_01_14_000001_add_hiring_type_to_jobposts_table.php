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
        if (Schema::hasTable('jobposts') && !Schema::hasColumn('jobposts', 'hiring_type')) {
            Schema::table('jobposts', function (Blueprint $table) {
                $table->enum('hiring_type', ['individual', 'team'])->default('individual')->after('job_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('jobposts') && Schema::hasColumn('jobposts', 'hiring_type')) {
            Schema::table('jobposts', function (Blueprint $table) {
                $table->dropColumn('hiring_type');
            });
        }
    }
};




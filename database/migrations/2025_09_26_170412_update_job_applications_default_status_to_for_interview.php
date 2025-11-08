<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For PostgreSQL, we just need to update the default value
        // The enum values should already be set by previous migrations
        DB::statement("ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'for_interview'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to 'pending' as default
        DB::statement("ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'pending'");
    }
};
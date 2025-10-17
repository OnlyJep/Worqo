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
        // Update the default status to 'for_interview' while preserving existing enum values
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('pending', 'for_interview', 'accepted', 'declined', 'fired') DEFAULT 'for_interview'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to 'pending' as default (enum values unchanged)
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('pending', 'for_interview', 'accepted', 'declined', 'fired') DEFAULT 'pending'");
    }
};
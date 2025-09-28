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
        // Update the default status from 'pending' to 'for_interview'
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('for_interview', 'accepted', 'declined', 'fired') DEFAULT 'for_interview'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to 'pending' as default
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'for_interview', 'fired') DEFAULT 'pending'");
    }
};
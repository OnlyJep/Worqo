<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddFiredStatusToJobApplications extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Use raw SQL to modify the enum
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'for_interview', 'fired') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert the status enum to original values
        DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'for_interview') DEFAULT 'pending'");
    }
}

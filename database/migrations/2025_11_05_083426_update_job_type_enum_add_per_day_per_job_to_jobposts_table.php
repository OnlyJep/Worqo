<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateJobTypeEnumAddPerDayPerJobToJobpostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Update job_type enum to include 'per_day' and 'per_job'
        \DB::statement("ALTER TABLE jobposts MODIFY COLUMN job_type ENUM('per_day', 'per_job', 'full-time', 'part-time', 'contract', 'freelance') NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert job_type enum back to previous values
        \DB::statement("ALTER TABLE jobposts MODIFY COLUMN job_type ENUM('full-time', 'part-time', 'contract', 'freelance') NOT NULL");
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSalaryTypeAndUpdateJobTypeInJobpostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('jobposts', function (Blueprint $table) {
            // Add salary_type field
            $table->enum('salary_type', ['per_hour', 'per_month'])->nullable()->after('salary');
        });
        
        // Update job_type enum to include 'freelance' instead of 'temporary'
        \DB::statement("ALTER TABLE jobposts MODIFY COLUMN job_type ENUM('full-time', 'part-time', 'contract', 'freelance') NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('jobposts', function (Blueprint $table) {
            $table->dropColumn('salary_type');
        });
        
        // Revert job_type enum back to original
        \DB::statement("ALTER TABLE jobposts MODIFY COLUMN job_type ENUM('full-time', 'part-time', 'contract', 'temporary') NOT NULL");
    }
}

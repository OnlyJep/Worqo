<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateJobApplicationsTableAddStatuses extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('job_applications', function (Blueprint $table) {
            // Modify the status enum to include 'fired'
            $table->enum('status', ['pending', 'accepted', 'declined', 'for_interview', 'fired'])->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('job_applications', function (Blueprint $table) {
            // Revert the status enum to original values
            $table->enum('status', ['pending', 'accepted', 'declined', 'for_interview'])->default('pending')->change();
        });
    }
}

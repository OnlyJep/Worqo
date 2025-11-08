<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Database\MigrationSafe;

class UpdateJobTypeEnumAddPerDayPerJobToJobpostsTable extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('jobposts') || !Schema::hasColumn('jobposts', 'job_type')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('jobposts', 'job_type');
        
        // Step 2: Add new CHECK constraint with updated values
        $this->safeAddCheckConstraint(
            'jobposts',
            'job_type',
            ['per_day', 'per_job', 'full-time', 'part-time', 'contract', 'freelance'],
            'jobposts_job_type_check'
        );
        
        // Step 3: Ensure NOT NULL
        $this->safeSetNotNull('jobposts', 'job_type');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('jobposts') || !Schema::hasColumn('jobposts', 'job_type')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('jobposts', 'job_type');
        
        // Step 2: Revert without 'per_day' and 'per_job'
        $this->safeAddCheckConstraint(
            'jobposts',
            'job_type',
            ['full-time', 'part-time', 'contract', 'freelance'],
            'jobposts_job_type_check'
        );
        
        // Step 3: Ensure NOT NULL
        $this->safeSetNotNull('jobposts', 'job_type');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Database\MigrationSafe;

class UpdateJobApplicationsTableAddStatuses extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('job_applications') || !Schema::hasColumn('job_applications', 'status')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('job_applications', 'status');
        
        // Step 2: Add new CHECK constraint with updated values
        $this->safeAddCheckConstraint(
            'job_applications',
            'status',
            ['pending', 'accepted', 'declined', 'for_interview', 'fired'],
            'job_applications_status_check'
        );
        
        // Step 3: Set default value
        $this->safeSetDefault('job_applications', 'status', 'pending');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('job_applications') || !Schema::hasColumn('job_applications', 'status')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('job_applications', 'status');
        
        // Step 2: Revert to original values
        $this->safeAddCheckConstraint(
            'job_applications',
            'status',
            ['pending', 'accepted', 'declined'],
            'job_applications_status_check'
        );
        
        // Step 3: Set default value
        $this->safeSetDefault('job_applications', 'status', 'pending');
    }
}

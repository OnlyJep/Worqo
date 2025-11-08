<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Database\MigrationSafe;

class AddSalaryTypeAndUpdateJobTypeInJobpostsTable extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('jobposts')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Add salary_type field (as string with CHECK constraint for enum-like behavior)
        if (!Schema::hasColumn('jobposts', 'salary_type')) {
            $this->safeAddColumn('jobposts', function (Blueprint $table) {
                $table->string('salary_type')->nullable()->after('salary');
            });
            
            // Add CHECK constraint for enum-like behavior
            $this->safeAddCheckConstraint(
                'jobposts',
                'salary_type',
                ['per_hour', 'per_month'],
                'jobposts_salary_type_check'
            );
        }
        
        // Step 2: Update job_type constraint
        if (Schema::hasColumn('jobposts', 'job_type')) {
            $this->safeDropCheckConstraint('jobposts', 'job_type');
            
            $this->safeAddCheckConstraint(
                'jobposts',
                'job_type',
                ['full-time', 'part-time', 'contract', 'freelance'],
                'jobposts_job_type_check'
            );
            
            $this->safeSetNotNull('jobposts', 'job_type');
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('jobposts')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop salary_type
        $this->safeDropCheckConstraint('jobposts', 'salary_type');
        $this->safeDropColumn('jobposts', 'salary_type');
        
        // Step 2: Revert job_type
        if (Schema::hasColumn('jobposts', 'job_type')) {
            $this->safeDropCheckConstraint('jobposts', 'job_type');
            
            $this->safeAddCheckConstraint(
                'jobposts',
                'job_type',
                ['full-time', 'part-time', 'contract', 'temporary'],
                'jobposts_job_type_check'
            );
            
            $this->safeSetNotNull('jobposts', 'job_type');
        }
    }
}

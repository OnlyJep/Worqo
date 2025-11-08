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
        // For PostgreSQL, we need to drop the existing constraint and add a new one
        // Find and drop all existing check constraints on the status column
        $constraints = DB::select("
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'job_applications' 
            AND ccu.column_name = 'status' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Drop the specific constraint name if it exists (in case it wasn't caught by the query above)
        DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check");
        
        // Add new check constraint with 'fired' status included
        DB::statement("ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'for_interview', 'fired'))");
        
        // Ensure default value is set
        DB::statement("ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Find and drop all existing check constraints on the status column
        $constraints = DB::select("
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'job_applications' 
            AND ccu.column_name = 'status' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Drop the specific constraint name if it exists
        DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check");
        
        // Add back the constraint without 'fired'
        DB::statement("ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'for_interview'))");
        
        // Ensure default value is set
        DB::statement("ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'pending'");
    }
}

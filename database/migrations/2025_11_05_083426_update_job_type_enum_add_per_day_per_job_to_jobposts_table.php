<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateJobTypeEnumAddPerDayPerJobToJobpostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // For PostgreSQL, we need to drop the existing constraint and add a new one
        // Find and drop all existing check constraints on the job_type column
        $constraints = DB::select("
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'jobposts' 
            AND ccu.column_name = 'job_type' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Drop the specific constraint name if it exists (in case it wasn't caught by the query above)
        DB::statement("ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS jobposts_job_type_check");
        
        // Add new check constraint with updated enum values
        DB::statement("ALTER TABLE jobposts ADD CONSTRAINT jobposts_job_type_check CHECK (job_type IN ('per_day', 'per_job', 'full-time', 'part-time', 'contract', 'freelance'))");
        
        // Ensure NOT NULL constraint
        DB::statement("ALTER TABLE jobposts ALTER COLUMN job_type SET NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Find and drop all existing check constraints on the job_type column
        $constraints = DB::select("
            SELECT tc.constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'jobposts' 
            AND ccu.column_name = 'job_type' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Drop the specific constraint name if it exists
        DB::statement("ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS jobposts_job_type_check");
        
        // Add back the constraint without 'per_day' and 'per_job'
        DB::statement("ALTER TABLE jobposts ADD CONSTRAINT jobposts_job_type_check CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance'))");
        
        // Ensure NOT NULL constraint
        DB::statement("ALTER TABLE jobposts ALTER COLUMN job_type SET NOT NULL");
    }
}

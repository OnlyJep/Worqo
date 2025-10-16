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
        // Use raw SQL to be more defensive
        DB::statement('ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS job_applications_job_post_id_foreign');
        DB::statement('ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS job_applications_worker_id_foreign');
        DB::statement('ALTER TABLE job_applications DROP INDEX IF EXISTS job_applications_job_post_id_worker_id_unique');
        
        Schema::table('job_applications', function (Blueprint $table) {
            // Make worker_id nullable since company applications won't have a worker_id
            $table->unsignedBigInteger('worker_id')->nullable()->change();
        });
        
        // Check if company_id column exists before adding it
        if (!Schema::hasColumn('job_applications', 'company_id')) {
            Schema::table('job_applications', function (Blueprint $table) {
                $table->unsignedBigInteger('company_id')->nullable()->after('worker_id');
            });
        }
        
        //Re-add foreign key constraints
        DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_job_post_id_foreign FOREIGN KEY (job_post_id) REFERENCES jobposts(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_worker_id_foreign FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE');
        
        // Only add company_id foreign key if it doesn't already exist
        $foreignKeys = DB::select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'job_applications' AND CONSTRAINT_NAME = 'job_applications_company_id_foreign'");
        if (empty($foreignKeys)) {
            DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_company_id_foreign FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys
        DB::statement('ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS job_applications_company_id_foreign');
        DB::statement('ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS job_applications_worker_id_foreign');
        DB::statement('ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS job_applications_job_post_id_foreign');
        
        Schema::table('job_applications', function (Blueprint $table) {
            // Drop company_id column
            $table->dropColumn('company_id');
            
            // Restore worker_id as non-nullable
            $table->unsignedBigInteger('worker_id')->nullable(false)->change();
        });
        
        // Re-add foreign key constraints and unique index
        DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_job_post_id_foreign FOREIGN KEY (job_post_id) REFERENCES jobposts(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_worker_id_foreign FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE job_applications ADD UNIQUE INDEX job_applications_job_post_id_worker_id_unique (job_post_id, worker_id)');
    }
};


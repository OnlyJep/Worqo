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
        if (Schema::hasTable('job_applications')) {
            // Drop unique index if it exists
            try {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->dropUnique('job_applications_job_post_id_worker_id_unique');
                });
            } catch (\Throwable $e) {
                // ignore if index missing
            }

            // Make worker_id nullable
            if (Schema::hasColumn('job_applications', 'worker_id')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->unsignedBigInteger('worker_id')->nullable()->change();
                });
            }

            // Add company_id if missing
            if (!Schema::hasColumn('job_applications', 'company_id')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('worker_id');
                });
            }

            // Add foreign keys, guard with try/catch to avoid duplicate errors
            try {
                DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_job_post_id_foreign FOREIGN KEY (job_post_id) REFERENCES jobposts(id) ON DELETE CASCADE');
            } catch (\Throwable $e) {}
            try {
                DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_worker_id_foreign FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE');
            } catch (\Throwable $e) {}
            try {
                DB::statement('ALTER TABLE job_applications ADD CONSTRAINT job_applications_company_id_foreign FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE');
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_applications')) {
            // Drop foreign keys (guarded)
            foreach (['job_applications_company_id_foreign','job_applications_worker_id_foreign','job_applications_job_post_id_foreign'] as $fk) {
                try { DB::statement("ALTER TABLE job_applications DROP FOREIGN KEY $fk"); } catch (\Throwable $e) {}
            }

            if (Schema::hasColumn('job_applications', 'company_id')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->dropColumn('company_id');
                });
            }

            if (Schema::hasColumn('job_applications', 'worker_id')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->unsignedBigInteger('worker_id')->nullable(false)->change();
                });
            }

            // Re-add unique index if columns exist
            try {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->unique(['job_post_id','worker_id'], 'job_applications_job_post_id_worker_id_unique');
                });
            } catch (\Throwable $e) {}
        }
    }
};


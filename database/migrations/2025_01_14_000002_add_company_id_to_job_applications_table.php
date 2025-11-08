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

            // Add company_id foreign key if companies table exists
            // Foreign keys for job_post_id and worker_id are already defined in create migration
            if (Schema::hasTable('companies') && Schema::hasColumn('job_applications', 'company_id')) {
                try {
                    Schema::table('job_applications', function (Blueprint $table) {
                        $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    });
                } catch (\Throwable $e) {
                    // Constraint might already exist or companies table doesn't exist yet
                    // This is safe to ignore - migration can be run multiple times
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_applications')) {
            // Drop company_id foreign key if it exists
            try {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->dropForeign(['company_id']);
                });
            } catch (\Throwable $e) {
                // Constraint might not exist, ignore error
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


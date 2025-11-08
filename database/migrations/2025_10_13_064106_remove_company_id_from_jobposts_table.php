<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class RemoveCompanyIdFromJobpostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('jobposts') && Schema::hasColumn('jobposts', 'company_id')) {
            // Find and drop any foreign key constraints on company_id column
            // This handles cases where the constraint might not exist or has a different name
            $constraints = DB::select("
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_name = 'jobposts' 
                AND kcu.column_name = 'company_id' 
                AND tc.constraint_type = 'FOREIGN KEY'
            ");
            
            foreach ($constraints as $constraint) {
                // Escape identifier name properly for PostgreSQL
                $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
                DB::statement("ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS {$constraintName}");
            }
            
            // Also try dropping by common Laravel constraint name patterns (safe with IF EXISTS)
            DB::statement('ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS jobposts_company_id_foreign');
            
            // Drop the company_id column
            Schema::table('jobposts', function (Blueprint $table) {
                $table->dropColumn('company_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('jobposts') && !Schema::hasColumn('jobposts', 'company_id')) {
            Schema::table('jobposts', function (Blueprint $table) {
                // Re-add the company_id column
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
            });
            
            // Re-add the foreign key constraint only if companies table exists
            if (Schema::hasTable('companies')) {
                try {
                    Schema::table('jobposts', function (Blueprint $table) {
                        $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                    });
                } catch (\Throwable $e) {
                    // Constraint might already exist, ignore error
                }
            }
        }
    }
}

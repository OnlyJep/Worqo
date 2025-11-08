<?php

/**
 * EXAMPLE: Safe Migration Template
 * 
 * This is a complete example showing how to use the MigrationSafe trait
 * for all common migration operations in PostgreSQL.
 * 
 * Copy this template when creating new migrations.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Database\MigrationSafe;

return new class extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Each operation runs in its own transaction to prevent transaction abort errors
        
        // 1. Add enum-like column with CHECK constraint
        if (!Schema::hasColumn('example_table', 'status')) {
            $this->safeAddColumn('example_table', function (Blueprint $table) {
                $table->string('status')->nullable()->after('id');
            });
            
            // Add CHECK constraint for enum-like behavior
            $this->safeAddCheckConstraint(
                'example_table',
                'status',
                ['pending', 'active', 'completed', 'cancelled'],
                'example_table_status_check'
            );
            
            // Set default value
            $this->safeSetDefault('example_table', 'status', 'pending');
        }
        
        // 2. Add foreign key column
        if (!Schema::hasColumn('example_table', 'company_id')) {
            $this->safeAddColumn('example_table', function (Blueprint $table) {
                $table->unsignedBigInteger('company_id')->nullable()->after('status');
            });
            
            // Add foreign key constraint
            $this->safeAddForeign('example_table', 'company_id', 'companies', 'id', 'cascade');
        }
        
        // 3. Add timestamp columns
        if (!Schema::hasColumn('example_table', 'time_in')) {
            $this->safeAddColumn('example_table', function (Blueprint $table) {
                $table->timestamp('time_in')->nullable()->after('company_id');
            });
        }
        
        if (!Schema::hasColumn('example_table', 'time_out')) {
            $this->safeAddColumn('example_table', function (Blueprint $table) {
                $table->timestamp('time_out')->nullable()->after('time_in');
            });
        }
        
        // 4. Add index
        if (Schema::hasColumn('example_table', 'status') && Schema::hasColumn('example_table', 'company_id')) {
            $this->safeAddIndex('example_table', ['status', 'company_id']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Each operation runs in its own transaction
        
        // 1. Drop index first
        $this->safeDropIndex('example_table', ['status', 'company_id']);
        
        // 2. Drop foreign key constraint
        $this->safeDropForeign('example_table', 'company_id');
        
        // 3. Drop CHECK constraint
        $this->safeDropCheckConstraint('example_table', 'status');
        
        // 4. Drop columns
        $this->safeDropColumn('example_table', ['time_in', 'time_out', 'company_id', 'status']);
    }
};


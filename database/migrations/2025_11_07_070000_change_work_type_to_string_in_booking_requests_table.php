<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Database\MigrationSafe;

return new class extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('booking_requests')) {
            return;
        }

        // Each operation in its own transaction to prevent transaction abort errors
        // Step 1: Drop index in separate transaction
        $this->safeDropIndex('booking_requests', ['service_type', 'work_type']);
        
        // Step 2: Drop CHECK constraints in separate transaction
        $this->safeDropCheckConstraint('booking_requests', 'work_type');
        
        // Step 3: Drop column in separate transaction
        $this->safeDropColumn('booking_requests', 'work_type');

        // Step 4: Add column back as string in separate transaction
        if (!Schema::hasColumn('booking_requests', 'work_type')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->string('work_type')->nullable()->after('sub_skill');
            });
        }

        // Step 5: Re-add index in separate transaction
        if (Schema::hasColumn('booking_requests', 'work_type')) {
            $this->safeAddIndex('booking_requests', ['service_type', 'work_type']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('booking_requests')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop index
        $this->safeDropIndex('booking_requests', ['service_type', 'work_type']);
        
        // Step 2: Drop column
        $this->safeDropColumn('booking_requests', 'work_type');

        // Step 3: Add back as enum with CHECK constraint
        if (!Schema::hasColumn('booking_requests', 'work_type')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->string('work_type')->nullable()->after('sub_skill');
            });
            
            // Add CHECK constraint for enum-like behavior
            $this->safeAddCheckConstraint(
                'booking_requests',
                'work_type',
                ['full-time', 'part-time', 'one-time'],
                'booking_requests_work_type_check'
            );
            
            // Re-add index
            $this->safeAddIndex('booking_requests', ['service_type', 'work_type']);
        }
    }
};


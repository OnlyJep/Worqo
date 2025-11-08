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
        if (!Schema::hasTable('workers') || !Schema::hasColumn('workers', 'is_reviewed')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('workers', 'is_reviewed');
        
        // Step 2: Add new CHECK constraint with updated values
        $this->safeAddCheckConstraint(
            'workers',
            'is_reviewed',
            ['TO BE REVIEWED', 'ACCEPTED', 'DECLINED'],
            'workers_is_reviewed_check'
        );
        
        // Step 3: Ensure nullable
        $this->safeDropNotNull('workers', 'is_reviewed');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('workers') || !Schema::hasColumn('workers', 'is_reviewed')) {
            return;
        }

        // Each operation in its own transaction
        // Step 1: Drop existing CHECK constraints
        $this->safeDropCheckConstraint('workers', 'is_reviewed');
        
        // Step 2: Revert to original values
        $this->safeAddCheckConstraint(
            'workers',
            'is_reviewed',
            ['ACCEPTED', 'DECLINED'],
            'workers_is_reviewed_check'
        );
        
        // Step 3: Ensure nullable
        $this->safeDropNotNull('workers', 'is_reviewed');
    }
};
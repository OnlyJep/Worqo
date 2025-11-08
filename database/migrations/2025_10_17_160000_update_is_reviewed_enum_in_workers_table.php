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
        // For PostgreSQL, we need to drop the existing constraint and add a new one
        // Find and drop all existing check constraints on the is_reviewed column
        $constraints = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'workers' 
            AND ccu.column_name = 'is_reviewed' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE workers DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Add new check constraint with updated enum values
        DB::statement("ALTER TABLE workers ADD CONSTRAINT workers_is_reviewed_check CHECK (is_reviewed IN ('TO BE REVIEWED', 'ACCEPTED', 'DECLINED'))");
        
        // Ensure nullable is set (already nullable, but ensure it stays that way)
        DB::statement("ALTER TABLE workers ALTER COLUMN is_reviewed DROP NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Find and drop all existing check constraints on the is_reviewed column
        $constraints = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'workers' 
            AND ccu.column_name = 'is_reviewed' 
            AND tc.constraint_type = 'CHECK'
        ");
        
        foreach ($constraints as $constraint) {
            // Escape identifier name properly for PostgreSQL (use double quotes for identifiers)
            $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
            DB::statement("ALTER TABLE workers DROP CONSTRAINT IF EXISTS {$constraintName}");
        }
        
        // Revert to original enum values
        DB::statement("ALTER TABLE workers ADD CONSTRAINT workers_is_reviewed_check CHECK (is_reviewed IN ('ACCEPTED', 'DECLINED'))");
        
        // Ensure nullable is set
        DB::statement("ALTER TABLE workers ALTER COLUMN is_reviewed DROP NOT NULL");
    }
};
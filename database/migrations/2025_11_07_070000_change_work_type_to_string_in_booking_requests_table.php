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
        if (Schema::hasTable('booking_requests') && Schema::hasColumn('booking_requests', 'work_type')) {
            // Drop the index first if it exists
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->dropIndex(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might not exist, ignore
            }
            
            // Drop the enum column constraint first (if it's an enum)
            // Find and drop CHECK constraints on work_type
            try {
                $constraints = DB::select("
                    SELECT tc.constraint_name 
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage ccu 
                        ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.table_name = 'booking_requests' 
                    AND ccu.column_name = 'work_type' 
                    AND tc.constraint_type = 'CHECK'
                ");
                
                foreach ($constraints as $constraint) {
                    $constraintName = '"' . str_replace('"', '""', $constraint->constraint_name) . '"';
                    DB::statement("ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS {$constraintName}");
                }
            } catch (\Throwable $e) {
                // No constraints found, continue
            }
            
            // Drop the column
            Schema::table('booking_requests', function (Blueprint $table) {
                $table->dropColumn('work_type');
            });
        }

        // Add it back as a string to match the bookings table
        if (Schema::hasTable('booking_requests') && !Schema::hasColumn('booking_requests', 'work_type')) {
            Schema::table('booking_requests', function (Blueprint $table) {
                $table->string('work_type')->nullable()->after('sub_skill');
            });
        }

        // Re-add the index
        if (Schema::hasTable('booking_requests') && Schema::hasColumn('booking_requests', 'work_type')) {
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->index(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might already exist, ignore
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('booking_requests') && Schema::hasColumn('booking_requests', 'work_type')) {
            // Drop the index first if it exists
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->dropIndex(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might not exist, ignore
            }
            
            // Drop the column
            Schema::table('booking_requests', function (Blueprint $table) {
                $table->dropColumn('work_type');
            });
        }

        // Add it back as enum
        if (Schema::hasTable('booking_requests') && !Schema::hasColumn('booking_requests', 'work_type')) {
            Schema::table('booking_requests', function (Blueprint $table) {
                $table->enum('work_type', ['full-time', 'part-time', 'one-time'])->nullable()->after('sub_skill');
            });
            
            // Re-add the index
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->index(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might already exist, ignore
            }
        }
    }
};


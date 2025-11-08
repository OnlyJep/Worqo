<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // Add min_points column if it doesn't exist
        if (!Schema::hasColumn('ranks', 'min_points')) {
            try {
                Schema::table('ranks', function (Blueprint $table) {
                    // Try to add after image, but PostgreSQL doesn't support after() in all cases
                    // So we'll just add it at the end
                    $table->integer('min_points')->default(0);
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error adding min_points column: ' . $e->getMessage());
            }
        }
        
        // Add max_points column if it doesn't exist
        if (!Schema::hasColumn('ranks', 'max_points')) {
            try {
                Schema::table('ranks', function (Blueprint $table) {
                    $table->integer('max_points')->nullable();
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error adding max_points column: ' . $e->getMessage());
            }
        }
        
        // Drop required_points column if it exists and min_points exists
        if (Schema::hasColumn('ranks', 'required_points') && Schema::hasColumn('ranks', 'min_points')) {
            try {
                Schema::table('ranks', function (Blueprint $table) {
                    $table->dropColumn('required_points');
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error dropping required_points column: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        if (Schema::hasColumn('ranks', 'min_points') || Schema::hasColumn('ranks', 'max_points')) {
            Schema::table('ranks', function (Blueprint $table) {
                // Remove the new columns if they exist
                if (Schema::hasColumn('ranks', 'min_points')) {
                    $table->dropColumn('min_points');
                }
                if (Schema::hasColumn('ranks', 'max_points')) {
                    $table->dropColumn('max_points');
                }
                // Re-add the old required_points column if it doesn't exist
                if (!Schema::hasColumn('ranks', 'required_points')) {
                    $table->integer('required_points')->default(0)->after('image');
                }
            });
        }
    }
};

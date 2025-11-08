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
        // Check if columns already exist before adding
        if (!Schema::hasColumn('ranks', 'min_points') || !Schema::hasColumn('ranks', 'max_points')) {
            Schema::table('ranks', function (Blueprint $table) {
                // Only drop required_points if it exists and min_points doesn't exist
                if (Schema::hasColumn('ranks', 'required_points') && !Schema::hasColumn('ranks', 'min_points')) {
                    $table->dropColumn('required_points');
                }
                
                // Add new min_points column if it doesn't exist
                if (!Schema::hasColumn('ranks', 'min_points')) {
                    $table->integer('min_points')->default(0)->after('image');
                }
                
                // Add new max_points column if it doesn't exist
                if (!Schema::hasColumn('ranks', 'max_points')) {
                    $table->integer('max_points')->nullable()->after('min_points');
                }
            });
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

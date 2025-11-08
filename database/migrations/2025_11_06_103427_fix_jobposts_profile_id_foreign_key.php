<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class FixJobpostsProfileIdForeignKey extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('jobposts') && Schema::hasColumn('jobposts', 'profile_id')) {
            // Drop the incorrect foreign key constraint on profile_id (safely)
            try {
                Schema::table('jobposts', function (Blueprint $table) {
                    $table->dropForeign(['profile_id']);
                });
            } catch (\Throwable $e) {
                // Foreign key might not exist, try alternative method
                try {
                    DB::statement('ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS jobposts_profile_id_foreign');
                } catch (\Throwable $e2) {
                    // Ignore if constraint doesn't exist
                }
            }
            
            // Re-add the foreign key constraint pointing to profiles table instead of users
            if (Schema::hasTable('profiles')) {
                try {
                    Schema::table('jobposts', function (Blueprint $table) {
                        $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('cascade');
                    });
                } catch (\Throwable $e) {
                    // Constraint might already exist, ignore
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('jobposts') && Schema::hasColumn('jobposts', 'profile_id')) {
            // Drop the foreign key constraint (safely)
            try {
                Schema::table('jobposts', function (Blueprint $table) {
                    $table->dropForeign(['profile_id']);
                });
            } catch (\Throwable $e) {
                // Foreign key might not exist, try alternative method
                try {
                    DB::statement('ALTER TABLE jobposts DROP CONSTRAINT IF EXISTS jobposts_profile_id_foreign');
                } catch (\Throwable $e2) {
                    // Ignore if constraint doesn't exist
                }
            }
            
            // Revert back to users table (if needed)
            if (Schema::hasTable('users')) {
                try {
                    Schema::table('jobposts', function (Blueprint $table) {
                        $table->foreign('profile_id')->references('id')->on('users')->onDelete('cascade');
                    });
                } catch (\Throwable $e) {
                    // Constraint might already exist, ignore
                }
            }
        }
    }
}

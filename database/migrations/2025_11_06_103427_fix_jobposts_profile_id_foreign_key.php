<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixJobpostsProfileIdForeignKey extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop the incorrect foreign key constraint on profile_id
        Schema::table('jobposts', function (Blueprint $table) {
            $table->dropForeign(['profile_id']);
        });
        
        // Re-add the foreign key constraint pointing to profiles table instead of users
        Schema::table('jobposts', function (Blueprint $table) {
            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert back to users table (if needed)
        Schema::table('jobposts', function (Blueprint $table) {
            $table->dropForeign(['profile_id']);
        });
        
        Schema::table('jobposts', function (Blueprint $table) {
            $table->foreign('profile_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
}

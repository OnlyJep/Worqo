<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Database\MigrationSafe;

class FixJobpostsProfileIdForeignKey extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Each operation in its own transaction
        // Step 1: Drop existing foreign key
        $this->safeDropForeign('jobposts', 'profile_id');
        
        // Step 2: Re-add foreign key pointing to profiles table
        $this->safeAddForeign('jobposts', 'profile_id', 'profiles', 'id', 'cascade');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Each operation in its own transaction
        // Step 1: Drop existing foreign key
        $this->safeDropForeign('jobposts', 'profile_id');
        
        // Step 2: Revert back to users table
        $this->safeAddForeign('jobposts', 'profile_id', 'users', 'id', 'cascade');
    }
}

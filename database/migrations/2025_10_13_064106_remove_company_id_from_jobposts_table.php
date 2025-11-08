<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Database\MigrationSafe;

class RemoveCompanyIdFromJobpostsTable extends Migration
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
        // Step 1: Drop foreign key constraints
        $this->safeDropForeign('jobposts', 'company_id');
        
        // Step 2: Drop the column
        $this->safeDropColumn('jobposts', 'company_id');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Each operation in its own transaction
        // Step 1: Re-add the column
        if (!Schema::hasColumn('jobposts', 'company_id')) {
            $this->safeAddColumn('jobposts', function (Blueprint $table) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
            });
        }
        
        // Step 2: Re-add foreign key constraint
        $this->safeAddForeign('jobposts', 'company_id', 'companies', 'id', 'cascade');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class RemoveContractorRoleFromRolesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // First, update all users with contractor role (role_id = 4) to Worker role (role_id = 1)
        // This prevents foreign key constraint violations
        DB::table('users')
            ->where('role_id', 4)
            ->update(['role_id' => 1]);
        
        // Remove Contractor role if it exists
        DB::table('roles')
            ->where(function ($query) {
                $query->where('role_name', 'Contractor')
                      ->orWhere('id', 4);
            })
            ->delete();
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Re-add Contractor role if it doesn't exist
        $contractorExists = DB::table('roles')
            ->where('role_name', 'Contractor')
            ->orWhere('id', 4)
            ->exists();

        if (!$contractorExists) {
            DB::table('roles')->insert([
                'id' => 4,
                'role_name' => 'Contractor',
                'created_at' => now(),
                'updated_at' => now(),
                'archived' => false,
            ]);
        }
    }
}

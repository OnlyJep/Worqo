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
        // Check if Contractor role already exists
        $contractorExists = DB::table('roles')
            ->where('role_name', 'Contractor')
            ->orWhere('id', 4)
            ->exists();

        if (!$contractorExists) {
            // Insert Contractor role with explicit ID 4
            DB::table('roles')->insert([
                'id' => 4,
                'role_name' => 'Contractor',
                'created_at' => now(),
                'updated_at' => now(),
                'archived' => false,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove Contractor role if it exists
        DB::table('roles')
            ->where('role_name', 'Contractor')
            ->orWhere('id', 4)
            ->delete();
    }
};


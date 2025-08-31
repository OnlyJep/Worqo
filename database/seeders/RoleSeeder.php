<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['role_name' => 'Worker', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'Employer', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('roles')->insert($roles);
    }
}
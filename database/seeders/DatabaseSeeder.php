<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            GenderSeeder::class,
            RoleSeeder::class,
            SuffixSeeder::class,
            SkillSeeder::class,
        ]);
    }
}
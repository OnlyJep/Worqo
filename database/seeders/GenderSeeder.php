<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GenderSeeder extends Seeder
{
    public function run(): void
    {
        $genders = [
            ['gender_name' => 'Male', 'created_at' => now(), 'updated_at' => now()],
            ['gender_name' => 'Female', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('genders')->insert($genders);
    }
}
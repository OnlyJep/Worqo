<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuffixSeeder extends Seeder
{
    public function run(): void
    {
        $suffixes = [
            ['suffix_name' => 'Jr.', 'created_at' => now(), 'updated_at' => now()],
            ['suffix_name' => 'Sr.', 'created_at' => now(), 'updated_at' => now()],
            ['suffix_name' => 'II', 'created_at' => now(), 'updated_at' => now()],
            ['suffix_name' => 'III', 'created_at' => now(), 'updated_at' => now()],
            ['suffix_name' => 'IV', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('suffixes')->insert($suffixes);
    }
}
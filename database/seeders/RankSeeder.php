<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RankSeeder extends Seeder
{
    public function run(): void
    {
        $ranks = [
            [
                'name' => 'Bronze',
                'image' => null,
                'min_points' => 0,
                'max_points' => 100,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Silver',
                'image' => null,
                'min_points' => 101,
                'max_points' => 300,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Gold',
                'image' => null,
                'min_points' => 301,
                'max_points' => 600,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Platinum',
                'image' => null,
                'min_points' => 601,
                'max_points' => 1000,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Diamond',
                'image' => null,
                'min_points' => 1001,
                'max_points' => null,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('ranks')->insert($ranks);
    }
}

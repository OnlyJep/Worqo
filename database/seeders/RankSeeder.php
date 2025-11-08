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
                'required_reviews' => 0,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Silver',
                'image' => null,
                'required_reviews' => 5,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Gold',
                'image' => null,
                'required_reviews' => 15,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Platinum',
                'image' => null,
                'required_reviews' => 30,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Diamond',
                'image' => null,
                'required_reviews' => 50,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        DB::table('ranks')->insert($ranks);
    }
}

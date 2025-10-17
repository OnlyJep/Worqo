<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class TestUserActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get the first user
        $user = User::first();
        
        if ($user) {
            // Display current last_activity
            echo "Current last_activity: " . ($user->last_activity ? $user->last_activity->format('Y-m-d H:i:s') : 'NULL') . "\n";
            
            // Update last_activity to now
            $user->last_activity = now();
            $user->save();
            
            // Display updated last_activity
            echo "Updated last_activity: " . $user->last_activity->format('Y-m-d H:i:s') . "\n";
        } else {
            echo "No user found\n";
        }
    }
}
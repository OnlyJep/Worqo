<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\Hash;

// Use the existing test user
$user = App\Models\User::first();

if (!$user) {
    echo "No user found. Creating a test user...\n";
    
    // Create a test user
    $user = new App\Models\User();
    $user->username = 'testuser';
    $user->email = 'test@example.com';
    $user->password = Hash::make('password');
    $user->role_id = 1;
    $user->save();
    
    echo "User created with ID: " . $user->id . "\n";
} else {
    echo "Found user with ID: " . $user->id . "\n";
}

echo "Test completed successfully.\n";
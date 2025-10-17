<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

require_once 'vendor/autoload.php';

// Create a test user
$user = new User();
$user->username = 'testuser';
$user->email = 'test@example.com';
$user->password = Hash::make('password');
$user->role_id = 1;
$user->save();

echo "User created with ID: " . $user->id . "\n";

// Test the user status endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/users/" . $user->id . "/status");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUserStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:user-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test user status functionality';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Create a test user
        $user = new User();
        $user->username = 'testuser';
        $user->email = 'test' . time() . '@example.com';
        $user->password = Hash::make('password');
        $user->role_id = 1;
        $user->save();

        $this->info("User created with ID: " . $user->id);

        // Test the user status endpoint
        $url = "http://127.0.0.1:8000/api/users/" . $user->id . "/status";
        $this->info("Testing endpoint: " . $url);

        // Use file_get_contents to test the endpoint
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10
            ]
        ]);

        $response = file_get_contents($url, false, $context);
        $httpCode = 200; // Default assumption

        if ($response === false) {
            $this->error("Failed to get response from endpoint");
            return 1;
        }

        $this->info("Response: " . $response);
        $this->info("Test completed successfully");

        return 0;
    }
}
<?php

return [
    'paths' => ['api/*'], // Restrict CORS to API routes
    'allowed_methods' => ['*'], // Allow all HTTP methods
    'allowed_origins' => [
        'http://localhost:8000',    // Laravel server
        'http://127.0.0.1:8000',   // Laravel server
        'http://localhost:3000',    // React frontend
        'http://127.0.0.1:3000',   // Alternative frontend
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'], // Allow all headers
    'exposed_headers' => [],
    'max_age' => 0, // No preflight caching
    'supports_credentials' => true, // Enable credentials if needed
];
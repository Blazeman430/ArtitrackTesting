<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        // Local development
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // Production frontend URL from environment variable
        env('FRONTEND_URL'),
    ]),
    'allowed_origins_patterns' => [
        // Allow all Vercel preview deployments
        '/^https:\/\/.*\.vercel\.app$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];


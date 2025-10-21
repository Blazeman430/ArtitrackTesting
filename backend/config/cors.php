<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // Explicit allow-list for production. FRONTEND_URL can be set to your primary site.
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        // Local development (optional)
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]),
    // Allow preview deployments from Vercel and Netlify
    'allowed_origins_patterns' => [
        '/^https:\\/\\/.*\\.vercel\\.app$/',
        '/^https:\\/\\/.*\\.netlify\\.app$/',
        '/^https:\\/\\/.*\\.railway\\.app$/',
        '/^https:\\/\\/.*\\.up\\.railway\\.app$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];


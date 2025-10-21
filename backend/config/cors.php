<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // Explicit allow-list for production. FRONTEND_URL can be set to your primary site.
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        // Railway backend domains
        'https://artitracktesting-production.up.railway.app',
        'https://artitracktesting-proxy.up.railway.app',
        // Local development (optional)
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]),
    // Allow preview deployments from Vercel, Netlify, and Render
    'allowed_origins_patterns' => [
        '/^https:\\/\\/.*\\.vercel\\.app$/',
        '/^https:\\/\\/.*\\.netlify\\.app$/',
        '/^https:\\/\\/.*\\.railway\\.app$/',
        '/^https:\\/\\/.*\\.up\\.railway\\.app$/',
        '/^https:\\/\\/.*\\.onrender\\.com$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];


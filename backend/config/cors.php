<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // Explicit allow-list for production. FRONTEND_URL can be set to your primary site.
    'allowed_origins' => [
        env('FRONTEND_URL'),
        // Railway backend domains
        'https://artitracktesting-production.up.railway.app',
        'https://artitracktesting-proxy.up.railway.app',
        // Local development
        'http://localhost:3000',
        'https://localhost:3000',
        'https://artitrack-frontend.onrender.com',
        'https://*.onrender.com',
        'https://artitracktesting.onrender.com',
    ],
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


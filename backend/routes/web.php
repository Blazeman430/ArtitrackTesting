<?php

use Illuminate\Support\Facades\Route;

// Health check route for Railway
Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'ArtiTrack Backend',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});

// All auth routes are now in api.php with Sanctum middleware

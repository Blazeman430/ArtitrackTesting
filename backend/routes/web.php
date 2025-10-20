<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::middleware('web')->group(function () {
    Route::post('/api/auth/login', [AuthController::class, 'login']);
});

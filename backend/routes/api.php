
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\ConcernController;
use App\Http\Controllers\AuthController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as FrameworkCsrf;
use App\Http\Middleware\VerifyCsrfToken as AppCsrf;

Route::get('/_ping', fn() => response()->json(['ok' => true]));

Route::post('/auth/login',  [AuthController::class, 'login'])
     ->withoutMiddleware([FrameworkCsrf::class, AppCsrf::class]);
     
Route::post('/auth/reload', [AuthController::class, 'reloadCsv']);

// ...existing top of file

Route::middleware('auth:sanctum')->group(function () {
  // ---- Auth ----
  Route::get('/auth/me',      [AuthController::class, 'me']);
  Route::post('/auth/logout', [AuthController::class, 'logout']);

  // ---- Borrower self-service (borrower only) ----
  Route::middleware('role:borrower')->group(function () {
    Route::get('/borrower/history',      [LoanController::class, 'myLoans']);
    Route::get('/borrower/history/{id}', [LoanController::class, 'myShow'])->whereNumber('id');
    Route::post('/loans',                [LoanController::class, 'store']);  // request
  });

  // ---- Custodian views/queue (custodian/admin) ----
  Route::middleware('role:custodian,admin,lab_faci')->group(function () {
    Route::get('/loans',         [LoanController::class, 'index']);
    Route::get('/loans/recent',  [LoanController::class, 'recent']);
    Route::get('/loans/history', [LoanController::class, 'history']);

    // actions
    Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->whereNumber('loan');
    Route::post('/loans/{loan}/decline', [LoanController::class, 'decline'])->whereNumber('loan');
    Route::post('/loans/{loan}/issue',   [LoanController::class, 'issue'])->whereNumber('loan');
    Route::post('/loans/{loan}/return',  [LoanController::class, 'return'])->whereNumber('loan');
    Route::post('/loans/{loan}/return-line/{line}', [LoanController::class, 'returnLine'])
         ->whereNumber('loan')->whereNumber('line');
  });
});

// Neutral/public reads can remain outside auth or be moved under auth if you prefer:
// Route::get('/items', [ItemController::class, 'index']);
// Route::get('/inventories', [InventoryController::class, 'index']);

// ---- Items ----
Route::get('/items', [ItemController::class, 'index']);
Route::post('/items', [ItemController::class, 'store']);
Route::match(['put','patch'],'/items/{item}', [ItemController::class,'update'])->whereNumber('item');
Route::delete('/items/{item}', [ItemController::class,'destroy'])->whereNumber('item');

// ---- Inventories ----
Route::get('/inventories', [InventoryController::class, 'index']);
Route::post('/inventories', [InventoryController::class, 'store']);
Route::delete('/inventories/{inventory}', [InventoryController::class, 'destroy'])->whereNumber('inventory');

// ---- Incidents ----
Route::get('/incidents',  [IncidentController::class,'index']);   // ?dept=HTM
Route::post('/incidents', [IncidentController::class,'store']);

// ---- Audits ----
Route::get('/audits',                 [AuditController::class,  'index']);
Route::post('/audits',                [AuditController::class,  'schedule']);
Route::post('/audits/{audit}/ack',    [AuditController::class,  'acknowledge'])->whereNumber('audit');
Route::post('/audits/{audit}/revise', [AuditController::class,  'requestRevision'])->whereNumber('audit');

// ---- Concerns ----
Route::get('/concerns',  [ConcernController::class,'index']);
Route::post('/concerns', [ConcernController::class,'store']);

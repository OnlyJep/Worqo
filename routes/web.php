<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Include test routes
if (app()->environment('local')) {
    include base_path('routes/test.php');
}

// Catch-all route for React Router
// This should be at the end of your web routes to handle any undefined routes
// and let React Router handle client-side routing
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
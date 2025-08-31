<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\GenderController;
use App\Http\Controllers\SuffixController;
use App\Http\Controllers\AdminUserController;

// AUTHENTICATION ROUTES (Passport)
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::post('/register', [RegisterController::class, 'register'])->name('register');
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth:api')->name('logout');

// PROFILE ROUTE (Requires Authentication)
Route::post('/profiles', [ProfileController::class, 'store'])->middleware('auth:api');

// USER MANAGEMENT ROUTES (No authentication)
Route::get('/users', [AdminUserController::class, 'getUsers'])->name('users.index');
Route::get('/users/archived', [AdminUserController::class, 'getArchivedUsers'])->name('users.archived');
Route::get('/users/{id}', [AdminUserController::class, 'getUser'])->name('users.show');
Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
Route::put('/users/{id}', [AdminUserController::class, 'update'])->name('users.update');
Route::patch('/users/{id}/archive', [AdminUserController::class, 'archive'])->name('users.archive');
Route::get('/users/list', [AdminUserController::class, 'getUserList'])->name('users.list');

// FETCH FOR REGISTRATION ROLES, GENDERS, AND SUFFIXES
Route::get('/roles', [RolesController::class, 'index']);
Route::get('/roles/all', [RolesController::class, 'all']);
Route::get('/genders', [GenderController::class, 'getGenders']);
Route::get('/suffixes', [SuffixController::class, 'getSuffixes']);
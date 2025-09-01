<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\GenderController;
use App\Http\Controllers\SuffixController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\RankController;
use App\Http\Controllers\CollarsController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\EmployerController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\AdminListController;

// AUTHENTICATION ROUTES
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::post('/register', [RegisterController::class, 'register'])->name('register');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// PROFILE ROUTE
Route::post('/profiles', [ProfileController::class, 'store']);

// USERS ROLE FETCH
Route::get('/userroles', [UserRoleController::class, 'fetchUsersByRole']);

// USERS ROUTES
Route::get('/users', [AdminUserController::class, 'index']);
Route::get('/users/archived', [AdminUserController::class, 'archived']);
Route::get('/users/{id}', [AdminUserController::class, 'show']);
Route::post('/users', [AdminUserController::class, 'store']);
Route::put('/users/{id}', [AdminUserController::class, 'update']);
Route::patch('/users/{id}/archive', [AdminUserController::class, 'archive']);

// ROLES ROUTES
Route::get('/roles', [RolesController::class, 'index'])->name('roles.index');
Route::get('/roles/all', [RolesController::class, 'all'])->name('roles.all');
Route::post('/roles', [RolesController::class, 'store'])->name('roles.store');
Route::put('/roles/{id}', [RolesController::class, 'update'])->name('roles.update');
Route::patch('/roles/{id}/archive', [RolesController::class, 'archive'])->name('roles.archive');
Route::post('/roles/bulk-archive', [RolesController::class, 'bulkArchive'])->name('roles.bulkArchive');

// RANKS ROUTES
Route::get('/ranks', [RankController::class, 'index'])->name('ranks.index');
Route::post('/ranks', [RankController::class, 'store'])->name('ranks.store');
Route::put('/ranks/{id}', [RankController::class, 'update'])->name('ranks.update');
Route::patch('/ranks/{id}/archive', [RankController::class, 'archive'])->name('ranks.archive');
Route::post('/ranks/bulk-archive', [RankController::class, 'bulkArchive'])->name('ranks.bulkArchive');

// COLLARS ROUTES
Route::get('/collars', [CollarsController::class, 'index'])->name('collars.index');
Route::get('/collars/{id}', [CollarsController::class, 'show'])->name('collars.show');
Route::post('/collars', [CollarsController::class, 'store'])->name('collars.store');
Route::put('/collars/{id}', [CollarsController::class, 'update'])->name('collars.update');
Route::delete('/collars/{id}', [CollarsController::class, 'destroy'])->name('collars.destroy');
Route::patch('/collars/{id}/archive', [CollarsController::class, 'archive'])->name('collars.archive');
Route::patch('/collars/{id}/restore', [CollarsController::class, 'restore'])->name('collars.restore');
Route::post('/collars/bulk-archive', [CollarsController::class, 'bulkArchive'])->name('collars.bulkArchive');
Route::post('/collars/bulk-restore', [CollarsController::class, 'bulkRestore'])->name('collars.bulkRestore');

// REVIEW ROUTES
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);
Route::put('/reviews/{id}', [ReviewController::class, 'update']);
Route::patch('/reviews/{id}/archive', [ReviewController::class, 'archive']);
Route::patch('/reviews/{id}/restore', [ReviewController::class, 'restore']);
Route::post('/reviews/bulk', [ReviewController::class, 'bulkAction']);

// SKILLS ROUTES
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/skills/archived', [SkillController::class, 'archived']);
Route::post('/skills', [SkillController::class, 'store']);
Route::put('/skills/{id}', [SkillController::class, 'update']);
Route::patch('/skills/{id}/archive', [SkillController::class, 'archive']);

// FETCH FOR REGISTRATION GENDERS AND SUFFIXES
Route::get('/genders', [GenderController::class, 'getGenders']);
Route::get('/suffixes', [SuffixController::class, 'getSuffixes']);

// EMPLOYER ROUTES
Route::get('/employers', [EmployerController::class, 'index']);
Route::get('/employers/archived', [EmployerController::class, 'archived']);
Route::get('/employers/{id}', [EmployerController::class, 'show']);
Route::post('/employers', [EmployerController::class, 'store']);
Route::put('/employers/{id}', [EmployerController::class, 'update']);
Route::patch('/employers/{id}/archive', [EmployerController::class, 'archive']);
Route::patch('/employers/{id}/restore', [EmployerController::class, 'restore']);

// WORKER ROUTES
Route::get('/workers', [WorkerController::class, 'index'])->name('workers.index');
Route::get('/workers/archived', [WorkerController::class, 'archived'])->name('workers.archived');
Route::get('/workers/{id}', [WorkerController::class, 'show'])->name('workers.show');
Route::post('/workers', [WorkerController::class, 'store'])->name('workers.store');
Route::put('/workers/{id}', [WorkerController::class, 'update'])->name('workers.update');
Route::patch('/workers/{id}/archive', [WorkerController::class, 'archive'])->name('workers.archive');
Route::post('/workers/bulk-archive', [WorkerController::class, 'bulkArchive'])->name('workers.bulkArchive');

// ADMIN ROUTES
Route::get('/admins', [AdminListController::class, 'index'])->name('admins.index');
Route::get('/admins/archived', [AdminListController::class, 'archived'])->name('admins.archived');
Route::get('/admins/{id}', [AdminListController::class, 'show'])->name('admins.show');
Route::post('/admins/register', [AdminListController::class, 'register'])->name('admins.register');
Route::post('/admins/{id}', [AdminListController::class, 'update'])->name('admins.update');
Route::patch('/admins/{id}/archive', [AdminListController::class, 'archive'])->name('admins.archive');
Route::post('/admins/bulk-archive', [AdminListController::class, 'bulkArchive'])->name('admins.bulkArchive');
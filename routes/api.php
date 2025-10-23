<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\GenderController;
use App\Http\Controllers\SuffixController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\RankController;
use App\Http\Controllers\CollarController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\EmployerController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\AdminListController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\JobPostController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SearchController;

// AUTHENTICATION ROUTES
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::post('/register', [RegisterController::class, 'register'])->name('register');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// PROFILE ROUTE
Route::post('/profiles', [ProfileController::class, 'store']);
Route::get('/profiles', [ProfileController::class, 'index']);

// USERS ROLE FETCH
Route::get('/userroles', [UserRoleController::class, 'fetchUsersByRole']);

// USERS ROUTES
Route::get('/users', [AdminUserController::class, 'index']);
Route::get('/users/archived', [AdminUserController::class, 'archived']);
Route::post('/users', [AdminUserController::class, 'store']);
Route::post('/users/bulk-archive', [AdminUserController::class, 'bulkArchive']);

// USER ROLE SWITCHING - Must be before /users/{id} route to avoid conflict
Route::post('/users/switch-role', [AdminUserController::class, 'switchUserRole'])->name('users.switchRole');

Route::get('/users/{id}', [AdminUserController::class, 'show']);
Route::get('/users/{id}/status', [AdminUserController::class, 'showWithStatus']);
Route::put('/users/{id}', [AdminUserController::class, 'update']);
Route::post('/users/{id}', [AdminUserController::class, 'update']); // For method spoofing with FormData
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
Route::get('/collars', [CollarController::class, 'index'])->name('collars.index');
Route::post('/collars', [CollarController::class, 'store'])->name('collars.store');
Route::put('/collars/{id}', [CollarController::class, 'update'])->name('collars.update');
Route::patch('/collars/{id}/archive', [CollarController::class, 'archive'])->name('collars.archive');
Route::post('/collars/bulk-archive', [CollarController::class, 'bulkArchive'])->name('collars.bulkArchive');

// REVIEW ROUTES
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);
Route::put('/reviews/{id}', [ReviewController::class, 'update']);
Route::patch('/reviews/{id}/archive', [ReviewController::class, 'archive']);
Route::patch('/reviews/{id}/restore', [ReviewController::class, 'restore']);
Route::post('/reviews/bulk', [ReviewController::class, 'bulkAction']);
Route::get('/reviews/worker/{workerId}', [ReviewController::class, 'getWorkerReviews']);

// SKILLS ROUTES
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/skills/archived', [SkillController::class, 'archived']);
Route::post('/skills', [SkillController::class, 'store']);
Route::put('/skills/{id}', [SkillController::class, 'update']);
Route::patch('/skills/{id}/archive', [SkillController::class, 'archive']);

// SERVICES ROUTES
Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
Route::get('/services/{id}', [ServiceController::class, 'show'])->name('services.show');
Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
Route::put('/services/{id}', [ServiceController::class, 'update'])->name('services.update');
Route::patch('/services/{id}/archive', [ServiceController::class, 'archive'])->name('services.archive');
Route::post('/services/bulk-archive', [ServiceController::class, 'bulkArchive'])->name('services.bulkArchive');

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
Route::get('/workers/admin', [WorkerController::class, 'adminIndex'])->name('workers.admin');
Route::get('/workers/by-skills', [WorkerController::class, 'getWorkersBySkills'])->name('workers.bySkills');
Route::get('/workers/archived', [WorkerController::class, 'archived'])->name('workers.archived');
Route::get('/workers/{id}', [WorkerController::class, 'show'])->name('workers.show');
Route::post('/workers', [WorkerController::class, 'store'])->name('workers.store');
Route::put('/workers/{id}', [WorkerController::class, 'update'])->name('workers.update');
Route::put('/workers/{id}/skills', [WorkerController::class, 'updateSkills'])->name('workers.updateSkills');
Route::put('/workers/{id}/preferences', [WorkerController::class, 'updatePreferences'])->name('workers.updatePreferences');
Route::post('/workers/{id}/update-credentials', [WorkerController::class, 'updateCredentials'])->name('workers.updateCredentials');
Route::patch('/workers/{id}/archive', [WorkerController::class, 'updateArchiveStatus'])->name('workers.archive');
Route::patch('/workers/{id}/review', [WorkerController::class, 'review'])->name('workers.review');
Route::post('/workers/bulk-archive', [WorkerController::class, 'bulkArchive'])->name('workers.bulkArchive');
Route::post('/workers/bulk-review', [WorkerController::class, 'bulkReview'])->name('workers.bulkReview');
Route::post('/workers/bulk-delete-declined', [WorkerController::class, 'bulkDeleteDeclined'])->name('workers.bulkDeleteDeclined');
Route::delete('/workers/{id}', [WorkerController::class, 'destroy'])->name('workers.destroy');
Route::post('/workers/bulk-delete-archived', [WorkerController::class, 'bulkDeleteArchived'])->name('workers.bulkDeleteArchived');

// FIXED: Only /add-skill (no /skills here – using SkillController)
Route::post('/add-skill', [WorkerController::class, 'addSkill'])->name('skills.add');
Route::delete('/remove-skill', [WorkerController::class, 'removeSkill'])->name('skills.remove');
Route::post('/complete-profile', [WorkerController::class, 'completeProfile'])->name('profile.complete');

// ADMIN ROUTES
Route::get('/admins', [AdminListController::class, 'index']);
Route::get('/admins/archived', [AdminListController::class, 'archived']);
Route::get('/admins/{id}', [AdminListController::class, 'show']);
Route::post('/admins', [AdminListController::class, 'store']);
Route::put('/admins/{id}', [AdminListController::class, 'update']);
Route::patch('/admins/{id}/archive', [AdminListController::class, 'archive']);
Route::post('/admins/bulk-archive', [AdminListController::class, 'bulkArchive']);

// COMPANY ROUTES
Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
Route::get('/companies/archived', [CompanyController::class, 'archived'])->name('companies.archived');
Route::get('/companies/{id}', [CompanyController::class, 'show'])->name('companies.show');
Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
Route::put('/companies/{id}', [CompanyController::class, 'update'])->name('companies.update');
Route::patch('/companies/{id}/archive', [CompanyController::class, 'archive'])->name('companies.archive');
Route::post('/companies/bulk-archive', [CompanyController::class, 'bulkArchive'])->name('companies.bulk-archive');

// JOB POST ROUTES
Route::get('/jobposts', [JobPostController::class, 'index'])->name('jobposts.index');
Route::get('/jobposts/{jobPost}', [JobPostController::class, 'show'])->name('jobposts.show');
Route::post('/jobposts', [JobPostController::class, 'store'])->name('jobposts.store');
Route::put('/jobposts/{jobPost}', [JobPostController::class, 'update'])->name('jobposts.update');
Route::patch('/jobposts/{jobPost}/archive', [JobPostController::class, 'archive'])->name('jobposts.archive');
Route::delete('/jobposts/{jobPost}', [JobPostController::class, 'destroy'])->name('jobposts.destroy');
Route::post('/jobposts/bulk-archive', [JobPostController::class, 'bulkArchive'])->name('jobposts.bulkArchive');
Route::post('/jobposts/check-expired', [JobPostController::class, 'checkExpiredJobs'])->name('jobposts.checkExpired');

// JOB APPLICATION ROUTES
Route::get('/job-applications/job/{jobPostId}', [JobApplicationController::class, 'getJobApplications'])->name('job-applications.job');
Route::post('/job-applications/apply', [JobApplicationController::class, 'applyForJob'])->name('job-applications.apply');
Route::post('/job-applications/{applicationId}/update', [JobApplicationController::class, 'updateApplication'])->name('job-applications.update');
Route::patch('/job-applications/{applicationId}/status', [JobApplicationController::class, 'updateApplicationStatus'])->name('job-applications.status');
Route::get('/job-applications/worker/{workerId}', [JobApplicationController::class, 'getWorkerApplications'])->name('job-applications.worker');
Route::post('/job-applications/check-availability', [JobApplicationController::class, 'checkWorkerAvailability'])->name('job-applications.check-availability');

// DASHBOARD STATS ROUTE    
Route::get('/dashboard-stats', [DashboardController::class, 'getDashboardStats'])->name('dashboard.stats');

// BOOKING ROUTES
Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
Route::get('/bookings/worker', [BookingController::class, 'getWorkerBookings'])->name('bookings.worker');
Route::get('/bookings/employer', [BookingController::class, 'getEmployerBookings'])->name('bookings.employer');
Route::get('/bookings/{id}', [BookingController::class, 'show'])->name('bookings.show');
Route::put('/bookings/{id}/status', [BookingController::class, 'updateStatus'])->name('bookings.updateStatus');
Route::post('/bookings/{id}/review', [BookingController::class, 'addReview'])->name('bookings.addReview');

// NOTIFICATION ROUTES (no auth middleware)
Route::get('/notifications', [NotificationController::class, 'index']);
Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::put('/notifications/{id}/unread', [NotificationController::class, 'markAsUnread']);
Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

// MESSAGES ROUTES (no auth middleware)
Route::get('/messages/conversations', [MessageController::class, 'conversations']);
Route::get('/messages/thread/{otherUserId}', [MessageController::class, 'thread']);
Route::post('/messages/send', [MessageController::class, 'send']);
// (Removed duplicate auth:api notifications block to avoid 401)

// SEARCH ROUTES
Route::get('/search/jobs', [SearchController::class, 'searchJobs'])->name('search.jobs');
Route::get('/search/workers', [SearchController::class, 'searchWorkers'])->name('search.workers');
Route::get('/search/skills/popular', [SearchController::class, 'getPopularSkills'])->name('search.skills.popular');
Route::get('/search/suggestions', [SearchController::class, 'getSearchSuggestions'])->name('search.suggestions');

// PASSWORD ROUTES
Route::middleware('auth:api')->group(function () {
    Route::post('/change-password', [PasswordController::class, 'changePassword'])->name('password.change');
    Route::post('/users/{id}/change-password', [PasswordController::class, 'changeUserPassword'])->name('password.change.user');
});
<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\NotificationController;
use Carbon\Carbon;

class JobApplicationController extends Controller
{
    /**
     * Get applications for a specific job post
     */
    public function getJobApplications($jobPostId)
    {
        $applications = JobApplication::where('job_post_id', $jobPostId)
            ->with([
                'worker' => function ($query) {
                    $query->select(
                        'profiles.id', 
                        'profiles.user_id', 
                        'profiles.first_name', 
                        'profiles.middlename', 
                        'profiles.last_name', 
                        'profiles.gender_id', 
                        'profiles.suffix_id', 
                        'profiles.profile_img', 
                        'profiles.city', 
                        'profiles.province'
                    )
                    ->with(['suffix' => function ($q) {
                        $q->select('id', 'suffix_name');
                    }]);
                },
                'worker.user' => function ($query) {
                    $query->select('id', 'email');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform to ensure profile_img is always accessible and add suffix_name
        $applications->transform(function ($application) {
            if ($application->worker) {
                // Ensure profile_img is set (can be null, that's fine)
                $application->worker->profile_img = $application->worker->profile_img ?? null;
                
                // Add suffix_name from the suffix relationship
                if ($application->worker->suffix) {
                    $application->worker->suffix_name = $application->worker->suffix->suffix_name;
                } else {
                    $application->worker->suffix_name = null;
                }
            }
            return $application;
        });

        return response()->json($applications);
    }

    /**
     * Apply for a job
     */
    public function applyForJob(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'job_post_id' => 'required|exists:jobposts,id',
            'worker_id' => 'required|exists:profiles,id',
            'cover_letter' => 'required|string',
            'skills' => 'nullable|array',
            'skills.*' => 'string',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if worker already applied
        $existingApplication = JobApplication::where('job_post_id', $request->job_post_id)
            ->where('worker_id', $request->worker_id)
            ->first();

        if ($existingApplication) {
            return response()->json(['message' => 'You have already applied for this job'], 400);
        }

        // Check if job is still accepting applications (using Philippines time)
        $jobPost = JobPost::find($request->job_post_id);
        if (!$jobPost) {
            return response()->json(['message' => 'Job post not found'], 404);
        }

        // Get current time in Philippines timezone
        $now = Carbon::now('Asia/Manila');
        
        // Parse job dates and convert to Philippines timezone for comparison
        // Database stores in UTC, so we need to convert to Philippines time for accurate comparison
        $applicationStart = Carbon::parse($jobPost->application_start, 'UTC')->setTimezone('Asia/Manila');
        $applicationDeadline = Carbon::parse($jobPost->application_deadline, 'UTC')->setTimezone('Asia/Manila');

        // Check if application period has started
        if ($now < $applicationStart) {
            $startDateStr = $applicationStart->format('F j, Y g:i A');
            return response()->json([
                'message' => "Applications have not started yet. They will start on {$startDateStr} (Philippines time)."
            ], 400);
        }

        // Check if application deadline has passed
        if ($now > $applicationDeadline) {
            return response()->json(['message' => 'Application deadline has passed.'], 400);
        }

        // Handle resume upload
        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumeDir = storage_path('app/public/resumes');
            if (!file_exists($resumeDir)) {
                mkdir($resumeDir, 0755, true);
            }
            $resumePath = $request->file('resume')->store('resumes', 'public');
        }

        $application = JobApplication::create([
            'job_post_id' => $request->job_post_id,
            'worker_id' => $request->worker_id,
            'cover_letter' => $request->cover_letter,
            'skills' => $request->skills,
            'resume_path' => $resumePath,
            'status' => 'for_interview',
        ]);

        $application->load(['worker' => function ($query) {
            $query->select('profiles.id', 'profiles.user_id', 'profiles.first_name', 'profiles.middlename', 'profiles.last_name', 'profiles.gender_id', 'profiles.suffix_id', 'profiles.profile_img', 'profiles.city', 'profiles.province')
                  ->with(['suffix' => function ($q) {
                      $q->select('id', 'suffix_name');
                  }]);
        }]);

        // Add suffix_name if suffix relationship exists
        if ($application->worker && $application->worker->suffix) {
            $application->worker->suffix_name = $application->worker->suffix->suffix_name;
        }

        // Notify job owner about new application
        if ($jobPost && $jobPost->profile_id) {
            NotificationController::createNotification(
                $jobPost->profile_id,
                $request->worker_id,
                'job_application',
                'New Job Application',
                'Someone applied to your job post.',
                $application->id,
                'job_application'
            );
        }

        return response()->json($application, 201);
    }

    /**
     * Update application (cover letter and resume)
     */
    public function updateApplication(Request $request, $applicationId)
    {
        // Log all incoming data for debugging
        \Log::info('UpdateApplication Debug', [
            'application_id' => $applicationId,
            'request_all' => $request->all(),
            'request_input_cover_letter' => $request->input('cover_letter'),
            'request_has_cover_letter' => $request->has('cover_letter'),
            'request_filled_cover_letter' => $request->filled('cover_letter'),
            'cover_letter_length' => strlen($request->input('cover_letter', '')),
            'has_file' => $request->hasFile('resume'),
            'content_type' => $request->header('Content-Type'),
            'method' => $request->method()
        ]);

        $validator = Validator::make($request->all(), [
            'cover_letter' => 'required|string|min:1',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = JobApplication::findOrFail($applicationId);
            
            \Log::info('Found application', [
                'application' => $application->toArray(),
                'fillable_fields' => $application->getFillable(),
                'table_columns' => \Schema::getColumnListing('job_applications')
            ]);
            
            // Update cover letter
            $application->cover_letter = $request->cover_letter;

            // Handle resume upload if provided
            if ($request->hasFile('resume')) {
                // Delete old resume if exists
                if ($application->resume_path) {
                    $oldResumePath = storage_path('app/public/' . $application->resume_path);
                    if (file_exists($oldResumePath)) {
                        unlink($oldResumePath);
                    }
                }

                // Upload new resume
                $resumeDir = storage_path('app/public/resumes');
                if (!file_exists($resumeDir)) {
                    mkdir($resumeDir, 0755, true);
                }
                $application->resume_path = $request->file('resume')->store('resumes', 'public');
            }

            \Log::info('About to save application', [
                'cover_letter' => $application->cover_letter,
                'resume_path' => $application->resume_path ?? 'no change'
            ]);

            $application->save();

            \Log::info('Application saved successfully');

            $application->load(['worker' => function ($query) {
                $query->select('profiles.id', 'profiles.user_id', 'profiles.first_name', 'profiles.middlename', 'profiles.last_name', 'profiles.gender_id', 'profiles.suffix_id', 'profiles.profile_img', 'profiles.city', 'profiles.province')
                      ->with(['suffix' => function ($q) {
                          $q->select('id', 'suffix_name');
                      }]);
            }]);

            // Add suffix_name if suffix relationship exists
            if ($application->worker && $application->worker->suffix) {
                $application->worker->suffix_name = $application->worker->suffix->suffix_name;
            }

            return response()->json($application);
            
        } catch (\Exception $e) {
            \Log::error('Error updating application', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update application status (accept/decline)
     */
    public function updateApplicationStatus(Request $request, $applicationId)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:accepted,declined,for_interview,fired',
        ]);
        // Notify applicant about status change
        $application = JobApplication::findOrFail($applicationId);
        $targetUserId = $application->worker_id; // if team/company, you may notify company owner
        if ($targetUserId) {
            $type = 'job_application_status';
            $title = 'Application Status Updated';
            $message = 'Your job application status is now: ' . $request->status;
            NotificationController::createNotification($targetUserId, null, $type, $title, $message, $application->id, 'job_application');
        }
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $application = JobApplication::findOrFail($applicationId);
        $application->update(['status' => $request->status]);

        $application->load(['worker' => function ($query) {
            $query->select('profiles.id', 'profiles.user_id', 'profiles.first_name', 'profiles.middlename', 'profiles.last_name', 'profiles.gender_id', 'profiles.suffix_id', 'profiles.profile_img', 'profiles.city', 'profiles.province')
                  ->with(['suffix' => function ($q) {
                      $q->select('id', 'suffix_name');
                  }]);
        }]);

        // Add suffix_name if suffix relationship exists
        if ($application->worker && $application->worker->suffix) {
            $application->worker->suffix_name = $application->worker->suffix->suffix_name;
        }

        return response()->json($application);
    }

    /**
     * Get applications by worker
     * Accepts either profile_id (worker_id) or user_id
     */
    public function getWorkerApplications($workerId)
    {
        // First, try to find applications by worker_id (profile_id)
        $applications = JobApplication::where('worker_id', $workerId)
            ->with(['jobPost' => function ($query) {
                $query->select('id', 'profile_id', 'job_title', 'description', 'salary', 'salary_type', 'job_type', 'application_start', 'application_deadline', 'work_start', 'work_end', 'skills')
                      ->with(['profile' => function ($profileQuery) {
                          $profileQuery->select('id', 'first_name', 'middlename', 'last_name', 'suffix_id')
                                       ->with(['suffix' => function ($suffixQuery) {
                                           $suffixQuery->select('id', 'suffix_name');
                                       }]);
                      }]);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // If no applications found, try to get profile_id from user_id
        if ($applications->isEmpty()) {
            $profile = \App\Models\Profile::where('user_id', $workerId)->first();
            if ($profile) {
                $applications = JobApplication::where('worker_id', $profile->id)
                    ->with(['jobPost' => function ($query) {
                        $query->select('id', 'profile_id', 'job_title', 'description', 'salary', 'salary_type', 'job_type', 'application_start', 'application_deadline', 'work_start', 'work_end', 'skills')
                              ->with(['profile' => function ($profileQuery) {
                                  $profileQuery->select('id', 'first_name', 'middlename', 'last_name', 'suffix_id')
                                               ->with(['suffix' => function ($suffixQuery) {
                                                   $suffixQuery->select('id', 'suffix_name');
                                               }]);
                              }]);
                    }])
                    ->orderBy('created_at', 'desc')
                    ->get();
            }
        }

        // Parse the skills JSON string for each job post
        $applications->each(function ($application) {
            if ($application->jobPost && $application->jobPost->skills) {
                $application->jobPost->skills = json_decode($application->jobPost->skills, true);
            }
        });

        return response()->json($applications);
    }

    /**
     * Check if a worker is available during a specific time period
     */
    public function checkWorkerAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'worker_id' => 'required|exists:profiles,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $workerId = $request->worker_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Check for overlapping work periods from accepted job applications
        $conflictingApplications = JobApplication::where('worker_id', $workerId)
            ->where('status', 'accepted')
            ->whereHas('jobPost', function ($query) use ($startDate, $endDate) {
                $query->where(function ($q) use ($startDate, $endDate) {
                    // Check if work periods overlap
                    $q->where(function ($subQ) use ($startDate, $endDate) {
                        // Job work_start is within the requested period
                        $subQ->whereBetween('work_start', [$startDate, $endDate])
                             ->orWhereBetween('work_end', [$startDate, $endDate])
                             // Or job period completely contains the requested period
                             ->orWhere(function ($innerQ) use ($startDate, $endDate) {
                                 $innerQ->where('work_start', '<=', $startDate)
                                        ->where('work_end', '>=', $endDate);
                             });
                    });
                });
            })
            ->with(['jobPost' => function ($query) {
                $query->select('id', 'job_title', 'work_start', 'work_end');
            }])
            ->get();

        $isAvailable = $conflictingApplications->isEmpty();

        return response()->json([
            'is_available' => $isAvailable,
            'conflicting_applications' => $conflictingApplications->map(function ($app) {
                return [
                    'id' => $app->id,
                    'job_title' => $app->jobPost->job_title,
                    'work_start' => $app->jobPost->work_start,
                    'work_end' => $app->jobPost->work_end,
                ];
            }),
        ]);
    }
}
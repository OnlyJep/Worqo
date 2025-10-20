<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\NotificationController;

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
                    $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                          ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
                },
                'company' // Load company relationship for team applications
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($applications);
    }

    /**
     * Apply for a job
     */
    public function applyForJob(Request $request)
    {
        // First, get the job post to check hiring_type
        $jobPost = JobPost::findOrFail($request->job_post_id);
        
        // Validate based on hiring_type
        if ($jobPost->hiring_type === 'team') {
            // For team hiring, require company_id
            $validator = Validator::make($request->all(), [
                'job_post_id' => 'required|exists:jobposts,id',
                'company_id' => 'required|exists:companies,id',
                'cover_letter' => 'required|string',
                'skills' => 'nullable|array',
                'skills.*' => 'string',
                'resume' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Check if company already applied
            $existingApplication = JobApplication::where('job_post_id', $request->job_post_id)
                ->where('company_id', $request->company_id)
                ->first();

            if ($existingApplication) {
                return response()->json(['message' => 'This company has already applied for this job'], 400);
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
                'company_id' => $request->company_id,
                'worker_id' => null,
                'cover_letter' => $request->cover_letter,
                'skills' => $request->skills,
                'resume_path' => $resumePath,
                'status' => 'for_interview',
            ]);

            $application->load('company');

            // Notify job owner about new application
            $jobOwnerId = ($jobPost = JobPost::find($request->job_post_id)) ? $jobPost->profile_id : null; // adjust if using users table
            if ($jobOwnerId) {
                NotificationController::createNotification(
                    $jobOwnerId,
                    null,
                    'job_application',
                    'New Job Application',
                    'A company applied to your job post.',
                    $application->id,
                    'job_application'
                );
            }

            return response()->json($application, 201);
        } else {
            // For individual hiring, require worker_id
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
                'company_id' => null,
                'cover_letter' => $request->cover_letter,
                'skills' => $request->skills,
                'resume_path' => $resumePath,
                'status' => 'for_interview',
            ]);

            $application->load(['worker' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }]);

            // Notify job owner about new application
            $jobOwnerId = ($jobPost = JobPost::find($request->job_post_id)) ? $jobPost->profile_id : null; // adjust if using users table
            if ($jobOwnerId) {
                NotificationController::createNotification(
                    $jobOwnerId,
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
            $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                  ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
        }]);

        return response()->json($application);
    }

    /**
     * Get applications by worker
     */
    public function getWorkerApplications($workerId)
    {
        $applications = JobApplication::where('worker_id', $workerId)
            ->with(['jobPost' => function ($query) {
                $query->select('id', 'profile_id', 'job_title', 'description', 'salary', 'salary_type', 'job_type', 'application_start', 'application_deadline', 'skills')
                      ->with(['profile' => function ($profileQuery) {
                          $profileQuery->select('id', 'first_name', 'middlename', 'last_name', 'suffix_id')
                                       ->with(['suffix' => function ($suffixQuery) {
                                           $suffixQuery->select('id', 'suffix_name');
                                       }]);
                      }]);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Parse the skills JSON string for each job post
        $applications->each(function ($application) {
            if ($application->jobPost && $application->jobPost->skills) {
                $application->jobPost->skills = json_decode($application->jobPost->skills, true);
            }
        });

        return response()->json($applications);
    }
}
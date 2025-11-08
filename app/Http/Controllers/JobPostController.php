<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\Skill;
use App\Models\Profile;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class JobPostController extends Controller
{
    public function index(Request $request)
    {
        try {
            $searchTerm = $request->query('search', '');
            $showArchived = $request->query('archived', false) === 'true';
            $showArchivedParam = $request->query('show_archived', false) === 'true';
            $profileId = $request->query('profile_id');
            $page = $request->query('page', 1);
            // For admin view (show_archived=true), use higher per page limit to show all job posts
            $perPage = $showArchivedParam ? 100 : 5;

        $query = JobPost::query()
            ->when($searchTerm, function ($query, $searchTerm) {
                return $query->where(function ($q) use ($searchTerm) {
                    $q->where('description', 'like', "%{$searchTerm}%")
                      ->orWhereJsonContains('skills', $searchTerm);
                });
            })
            ->when($profileId, function ($query, $profileId) {
                return $query->where('profile_id', $profileId);
            });

        // If show_archived=true is passed, show both archived and non-archived jobs
        // Otherwise, filter by archived status
        if ($showArchivedParam) {
            // Show all jobs (both archived and non-archived) for admin or profile owners
            // Don't apply any archived filter
            // Also don't filter by application_start for admin view
        } else {
            // For public job listings (like FindJob), only show non-archived jobs
            $query->where('archived', $showArchived);
            // Only show jobs where application_start has already passed (Philippines time)
            // Compare UTC times - application_start is stored in UTC but represents Philippines time
            $now = Carbon::now('Asia/Manila');
            $query->where('application_start', '<=', $now->utc());
        }

        // Auto-archive expired job posts (using Philippine Standard Time GMT+8)
        // Compare UTC times - application_deadline is stored in UTC but represents Philippines time
        $now = Carbon::now('Asia/Manila');
        JobPost::where('application_deadline', '<', $now->utc())
            ->where('archived', false)
            ->update(['archived' => true]);

        $jobPosts = $query->with([
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name', 'profiles.profile_img')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            },
            'applications' => function ($query) {
                $query->select('id', 'job_post_id', 'status');
            }
        ])->paginate($perPage, ['*'], 'page', $page);

        $skills = Skill::all()->pluck('name', 'id')->toArray();

         $jobPosts->getCollection()->transform(function ($post) use ($skills) {
             // Parse skills from JSON format
             $skillsData = is_string($post->skills) ? json_decode($post->skills, true) : $post->skills;
             $skillExperiences = is_string($post->skill_experiences) ? json_decode($post->skill_experiences, true) : $post->skill_experiences;
             
             // Format skills with experience levels for display
             $formattedSkills = [];
             if (is_array($skillsData)) {
                 foreach ($skillsData as $skill) {
                     if (is_array($skill) && isset($skill['name']) && isset($skill['experience'])) {
                         $formattedSkills[] = $skill['name'] . ' (' . $skill['experience'] . ')';
                     }
                 }
             }
             $post->skills_formatted = $formattedSkills;
             
             // Add skills data back to the post for frontend
             $post->skills = $skillsData;
             $post->skill_experiences = $skillExperiences;
             
            // Add application count (only count accepted applications)
            $post->application_count = $post->applications->where('status', 'accepted')->count();
            
            // Also add total applications count for reference
            $post->total_applications = $post->applications->count();
             
             return $post;
         });

            return response()->json([
                'job_posts' => $jobPosts,
                'skills' => array_values($skills),
                'pagination' => [
                    'current_page' => $jobPosts->currentPage(),
                    'total_pages' => $jobPosts->lastPage(),
                    'total_items' => $jobPosts->total(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching job posts: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json([
                'error' => 'Failed to fetch job posts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_id' => 'required|exists:profiles,id',
            'job_title' => 'required|string|max:255',
            'skills' => 'nullable|array',
            'skill_experiences' => 'nullable|array',
            'description' => 'required|string',
            'salary' => 'required|numeric|min:1',
            'salary_type' => 'required|in:per_hour,per_month',
            'job_type' => 'required|in:per_day,per_job,full-time,part-time,contract,freelance',
            'hiring_type' => 'required|in:individual,team',
            'team_size' => 'nullable|integer|min:1|max:50',
            'work_start' => 'required|date',
            'work_end' => 'required|date|after:work_start',
            'application_start' => 'required|date',
            'application_deadline' => 'required|date|after:application_start',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();


         // Parse dates - they come as ISO strings from frontend
         // The ISO string represents a moment in time that was entered as Philippines time
         // For example: user enters "2025-04-11T10:15" (Philippines time)
         // Frontend converts to "2025-04-11T02:15:00.000Z" (UTC, 8 hours earlier)
         // We parse as UTC and store - when retrieved, we'll convert back to Philippines time
         $workStart = Carbon::parse($validated['work_start'], 'UTC');
         $workEnd = Carbon::parse($validated['work_end'], 'UTC');
         $applicationStart = Carbon::parse($validated['application_start'], 'UTC');
         $applicationDeadline = Carbon::parse($validated['application_deadline'], 'UTC');
         
         $jobPost = JobPost::create([
             'profile_id' => $validated['profile_id'],
             'job_title' => $validated['job_title'],
             'skills' => json_encode($validated['skills'] ?? []),
             'skill_experiences' => json_encode($validated['skill_experiences'] ?? []),
             'description' => $validated['description'],
             'salary' => $validated['salary'],
             'salary_type' => $validated['salary_type'],
             'job_type' => $validated['job_type'],
             'hiring_type' => $validated['hiring_type'],
             'team_size' => $validated['team_size'] ?? ($validated['hiring_type'] === 'team' ? 2 : 1),
             'work_start' => $workStart,
             'work_end' => $workEnd,
             'application_start' => $applicationStart,
             'application_deadline' => $applicationDeadline,
             'archived' => false, // Don't auto-archive on creation
         ]);

        $jobPost->load([
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name', 'profiles.profile_img')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        
        // Parse skills from JSON format
        $skillsData = is_string($jobPost->skills) ? json_decode($jobPost->skills, true) : $jobPost->skills;
        $skillExperiences = is_string($jobPost->skill_experiences) ? json_decode($jobPost->skill_experiences, true) : $jobPost->skill_experiences;
        
        // Format skills with experience levels for display
        $formattedSkills = [];
        if (is_array($skillsData)) {
            foreach ($skillsData as $skill) {
                if (is_array($skill) && isset($skill['name']) && isset($skill['experience'])) {
                    $formattedSkills[] = $skill['name'] . ' (' . $skill['experience'] . ')';
                }
            }
        }
        $jobPost->skills_formatted = $formattedSkills;
        
        // Add skills data back to the post for frontend
        $jobPost->skills = $skillsData;
        $jobPost->skill_experiences = $skillExperiences;

        return response()->json($jobPost, 201);
    }

    public function show(JobPost $jobPost)
    {
        $jobPost->load([
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name', 'profiles.profile_img')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        
        // Parse skills from JSON format
        $skillsData = is_string($jobPost->skills) ? json_decode($jobPost->skills, true) : $jobPost->skills;
        $skillExperiences = is_string($jobPost->skill_experiences) ? json_decode($jobPost->skill_experiences, true) : $jobPost->skill_experiences;
        
        // Format skills with experience levels for display
        $formattedSkills = [];
        if (is_array($skillsData)) {
            foreach ($skillsData as $skill) {
                if (is_array($skill) && isset($skill['name']) && isset($skill['experience'])) {
                    $formattedSkills[] = $skill['name'] . ' (' . $skill['experience'] . ')';
                }
            }
        }
        $jobPost->skills_formatted = $formattedSkills;
        
        // Add skills data back to the post for frontend
        $jobPost->skills = $skillsData;
        $jobPost->skill_experiences = $skillExperiences;

        return response()->json($jobPost);
    }

    public function update(Request $request, JobPost $jobPost)
    {
        $validator = Validator::make($request->all(), [
            'profile_id' => 'required|exists:profiles,id',
            'job_title' => 'required|string|max:255',
            'skills' => 'nullable|array',
            'skill_experiences' => 'nullable|array',
            'description' => 'required|string',
            'salary' => 'required|numeric|min:1',
            'salary_type' => 'required|in:per_hour,per_month',
            'job_type' => 'required|in:per_day,per_job,full-time,part-time,contract,freelance',
            'hiring_type' => 'required|in:individual,team',
            'team_size' => 'nullable|integer|min:1|max:50',
            'work_start' => 'required|date',
            'work_end' => 'required|date|after:work_start',
            'application_start' => 'required|date',
            'application_deadline' => 'required|date|after:application_start',
            'archived' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        // Parse dates - they come as ISO strings from frontend
        // The ISO string represents a moment in time that was entered as Philippines time
        // For example: user enters "2025-04-11T10:15" (Philippines time)
        // Frontend converts to "2025-04-11T02:15:00.000Z" (UTC, 8 hours earlier)
        // We parse as UTC and store - when retrieved, we'll convert back to Philippines time
        $workStart = Carbon::parse($validated['work_start'], 'UTC');
        $workEnd = Carbon::parse($validated['work_end'], 'UTC');
        $applicationStart = Carbon::parse($validated['application_start'], 'UTC');
        $applicationDeadline = Carbon::parse($validated['application_deadline'], 'UTC');

        $jobPost->update([
            'profile_id' => $validated['profile_id'],
            'job_title' => $validated['job_title'],
            'skills' => json_encode($validated['skills'] ?? []),
            'skill_experiences' => json_encode($validated['skill_experiences'] ?? []),
            'description' => $validated['description'],
            'salary' => $validated['salary'],
            'salary_type' => $validated['salary_type'],
            'job_type' => $validated['job_type'],
            'hiring_type' => $validated['hiring_type'],
            'team_size' => $validated['team_size'] ?? ($validated['hiring_type'] === 'team' ? 2 : 1),
            'work_start' => $workStart,
            'work_end' => $workEnd,
            'application_start' => $applicationStart,
            'application_deadline' => $applicationDeadline,
            'archived' => $validated['archived'] ?? $applicationDeadline->isPast(),
        ]);

        $jobPost->load([
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name', 'profiles.profile_img')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        
        // Parse skills from JSON format
        $skillsData = is_string($jobPost->skills) ? json_decode($jobPost->skills, true) : $jobPost->skills;
        $skillExperiences = is_string($jobPost->skill_experiences) ? json_decode($jobPost->skill_experiences, true) : $jobPost->skill_experiences;
        
        // Format skills with experience levels for display
        $formattedSkills = [];
        if (is_array($skillsData)) {
            foreach ($skillsData as $skill) {
                if (is_array($skill) && isset($skill['name']) && isset($skill['experience'])) {
                    $formattedSkills[] = $skill['name'] . ' (' . $skill['experience'] . ')';
                }
            }
        }
        $jobPost->skills_formatted = $formattedSkills;
        
        // Add skills data back to the post for frontend
        $jobPost->skills = $skillsData;
        $jobPost->skill_experiences = $skillExperiences;

        return response()->json($jobPost);
    }

    public function archive(JobPost $jobPost, Request $request)
    {
        $validated = $request->validate([
            'archived' => 'required|boolean',
        ]);

        $jobPost->update([
            'archived' => $validated['archived'],
        ]);

        $jobPost->load([
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name', 'profiles.profile_img')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        
        return response()->json($jobPost);
    }

    public function destroy(JobPost $jobPost)
    {
        $jobPost->delete();
        return response()->json(null, 204);
    }

    public function bulkArchive(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:jobposts,id',
            'archived' => 'required|boolean',
        ]);

        JobPost::whereIn('id', $validated['ids'])->update([
            'archived' => $validated['archived'],
        ]);

        return response()->json(['message' => 'Bulk action completed']);
    }

        /**
     * Check if a job post is expired and should be archived
     */
    public function checkExpiredJobs()
    {
        // Compare UTC times - application_deadline is stored in UTC but represents Philippines time
        $now = Carbon::now('Asia/Manila');
        $expiredCount = JobPost::where('application_deadline', '<', $now->utc())
            ->where('archived', false)
            ->update(['archived' => true]);

        return response()->json([
            'message' => "Archived {$expiredCount} expired job posts",
            'archived_count' => $expiredCount
        ]);
    }

}
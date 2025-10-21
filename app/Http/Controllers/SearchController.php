<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\Skill;
use App\Models\Worker;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    /**
     * Search for jobs by skills or keywords
     */
    public function searchJobs(Request $request)
    {
        try {
            $searchTerm = $request->query('q', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);

            if (empty($searchTerm)) {
                return response()->json([
                    'jobs' => [],
                    'total' => 0,
                    'message' => 'Please provide a search term'
                ], 400);
            }

            $query = JobPost::with(['profile.user'])
                ->where('archived', false)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('job_title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhereJsonContains('skills', $searchTerm);
                });

            $jobs = $query->orderBy('created_at', 'desc')
                         ->paginate($limit, ['*'], 'page', $page);

            $formattedJobs = $jobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'job_title' => $job->job_title,
                    'description' => $job->description,
                    'skills' => $job->skills,
                    'salary_range' => $job->salary_range,
                    'location' => $job->location,
                    'job_type' => $job->job_type,
                    'application_deadline' => $job->application_deadline,
                    'employer' => [
                        'id' => $job->profile->user->id,
                        'name' => $job->profile->first_name . ' ' . $job->profile->last_name,
                        'company' => $job->profile->company_name ?? 'N/A'
                    ],
                    'created_at' => $job->created_at,
                    'updated_at' => $job->updated_at
                ];
            });

            return response()->json([
                'jobs' => $formattedJobs,
                'total' => $jobs->total(),
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage()
            ]);

        } catch (\Exception $e) {
            Log::error('Search jobs error: ' . $e->getMessage());
            return response()->json(['error' => 'Search failed'], 500);
        }
    }

    /**
     * Search for workers by skills
     */
    public function searchWorkers(Request $request)
    {
        try {
            $searchTerm = $request->query('q', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);

            if (empty($searchTerm)) {
                return response()->json([
                    'workers' => [],
                    'total' => 0,
                    'message' => 'Please provide a search term'
                ], 400);
            }

            $query = User::with(['profile', 'worker'])
                ->where('role_id', 1) // Workers only
                ->where('archived', false)
                ->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'ACCEPTED');
                })
                ->where(function ($q) use ($searchTerm) {
                    $q->whereHas('profile', function ($subQ) use ($searchTerm) {
                        $subQ->where('first_name', 'like', "%{$searchTerm}%")
                             ->orWhere('last_name', 'like', "%{$searchTerm}%");
                    })->orWhereHas('worker', function ($subQ) use ($searchTerm) {
                        $subQ->where('skills_id', 'like', "%{$searchTerm}%");
                    });
                });

            $workers = $query->orderBy('created_at', 'desc')
                            ->paginate($limit, ['*'], 'page', $page);

            $formattedWorkers = $workers->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->profile->first_name . ' ' . $user->profile->last_name,
                    'skills' => $user->worker->skills_id ? json_decode($user->worker->skills_id, true) : [],
                    'location' => $user->profile->address ?? 'N/A',
                    'profile_picture' => $user->profile->profile_picture ?? null,
                    'created_at' => $user->created_at
                ];
            });

            return response()->json([
                'workers' => $formattedWorkers,
                'total' => $workers->total(),
                'current_page' => $workers->currentPage(),
                'last_page' => $workers->lastPage(),
                'per_page' => $workers->perPage()
            ]);

        } catch (\Exception $e) {
            Log::error('Search workers error: ' . $e->getMessage());
            return response()->json(['error' => 'Search failed'], 500);
        }
    }

    /**
     * Get popular/common skills for homepage
     */
    public function getPopularSkills()
    {
        try {
            // Get skills that are most commonly used in job posts
            $popularSkills = Skill::where('archived', false)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get(['id', 'skill_name', 'sub_skills', 'collar']);

            $formattedSkills = $popularSkills->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                    'sub_skills' => $skill->sub_skills ?? [],
                    'collar' => $skill->collar
                ];
            });

            return response()->json([
                'skills' => $formattedSkills,
                'total' => $formattedSkills->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Get popular skills error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch skills'], 500);
        }
    }

    /**
     * Get search suggestions based on partial input
     */
    public function getSearchSuggestions(Request $request)
    {
        try {
            $query = $request->query('q', '');
            
            if (strlen($query) < 2) {
                return response()->json(['suggestions' => []]);
            }

            // Get skill suggestions
            $skillSuggestions = Skill::where('archived', false)
                ->where('skill_name', 'like', "%{$query}%")
                ->limit(5)
                ->get(['skill_name']);

            // Get job title suggestions
            $jobSuggestions = JobPost::where('archived', false)
                ->where('job_title', 'like', "%{$query}%")
                ->distinct()
                ->limit(5)
                ->get(['job_title']);

            $suggestions = collect()
                ->merge($skillSuggestions->pluck('skill_name'))
                ->merge($jobSuggestions->pluck('job_title'))
                ->unique()
                ->take(10)
                ->values();

            return response()->json(['suggestions' => $suggestions]);

        } catch (\Exception $e) {
            Log::error('Get search suggestions error: ' . $e->getMessage());
            return response()->json(['suggestions' => []]);
        }
    }
}
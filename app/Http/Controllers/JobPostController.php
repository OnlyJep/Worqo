<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\Skill;
use App\Models\Rank;
use App\Models\Company;
use App\Models\Profile;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class JobPostController extends Controller
{
    public function index(Request $request)
    {
        $searchTerm = $request->query('search', '');
        $showArchived = $request->query('archived', false) === 'true';
        $page = $request->query('page', 1);
        $perPage = 5;

        $query = JobPost::query()
            ->when($searchTerm, function ($query, $searchTerm) {
                return $query->where(function ($q) use ($searchTerm) {
                    $q->where('company_id', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhereJsonContains('skills', $searchTerm);
                });
            })
            ->where('archived', $showArchived);

        JobPost::where('application_deadline', '<', Carbon::now())
            ->where('archived', false)
            ->update(['archived' => true]);

        $jobPosts = $query->with([
            'company' => function ($query) {
                $query->select('id', 'company_name', 'profile_id', 'street', 'contact_number', 'city', 'province', 'postal_code', 'country', 'archived');
            },
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ])->paginate($perPage, ['*'], 'page', $page);

        $skills = Skill::all()->pluck('name', 'id')->toArray();
        $ranks = Rank::all()->pluck('name', 'id')->toArray();

        $jobPosts->getCollection()->transform(function ($post) use ($skills, $ranks) {
            $post->skills_formatted = array_map(function ($skill, $rank) {
                return "{$skill} - {$rank}";
            }, $post->skills ?? [], $post->ranks ?? []);
            if ($post->company && $post->company->profile_id) {
                try {
                    $profileIds = json_decode($post->company->profile_id, true);
                    if (is_array($profileIds)) {
                        $selectedProfileId = in_array("3", $profileIds) ? "3" : $profileIds[0];
                        $post->company->employer = Profile::select('id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                            ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id')
                            ->where('profiles.id', $selectedProfileId)
                            ->first();
                        $post->company->employer_id = $selectedProfileId;
                    }
                } catch (\Exception $e) {
                    \Log::error("Error parsing profile_id for company {$post->company->id}: {$e->getMessage()}");
                }
            }
            return $post;
        });

        return response()->json([
            'job_posts' => $jobPosts,
            'skills' => array_values($skills),
            'ranks' => array_values($ranks),
            'pagination' => [
                'current_page' => $jobPosts->currentPage(),
                'total_pages' => $jobPosts->lastPage(),
                'total_items' => $jobPosts->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'profile_id' => [
                'required',
                'exists:profiles,id',
                function ($attribute, $value, $fail) use ($request) {
                    $company = Company::find($request->company_id);
                    if ($company && $company->profile_id) {
                        try {
                            $profileIds = json_decode($company->profile_id, true);
                            if (!is_array($profileIds) || !in_array((string)$value, $profileIds)) {
                                $fail('The profile_id must match one of the company\'s profile IDs.');
                            }
                        } catch (\Exception $e) {
                            $fail('Invalid company profile_id format.');
                        }
                    }
                },
            ],
            'skills' => 'required|array',
            'ranks' => 'required|array',
            'description' => 'required|string',
            'salary' => 'nullable|numeric|min:1',
            'job_type' => 'required|in:full-time,part-time,contract,temporary',
            'street' => 'nullable|string',
            'city' => 'required|string',
            'province' => 'required|string',
            'postal_code' => 'required|string',
            'country' => 'required|string',
            'application_start' => 'required|date',
            'application_deadline' => 'required|date|after:application_start',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $jobPost = JobPost::create([
            'company_id' => $validated['company_id'],
            'profile_id' => $validated['profile_id'],
            'skills' => $validated['skills'],
            'ranks' => $validated['ranks'],
            'description' => $validated['description'],
            'salary' => $validated['salary'],
            'job_type' => $validated['job_type'],
            'street' => $validated['street'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'postal_code' => $validated['postal_code'],
            'country' => $validated['country'],
            'application_start' => Carbon::parse($validated['application_start']),
            'application_deadline' => Carbon::parse($validated['application_deadline']),
            'archived' => Carbon::parse($validated['application_deadline'])->isPast(),
        ]);

        $jobPost->load([
            'company' => function ($query) {
                $query->select('id', 'company_name', 'profile_id', 'street', 'contact_number', 'city', 'province', 'postal_code', 'country', 'archived');
            },
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        if ($jobPost->company && $jobPost->company->profile_id) {
            try {
                $profileIds = json_decode($jobPost->company->profile_id, true);
                if (is_array($profileIds)) {
                    $selectedProfileId = in_array("3", $profileIds) ? "3" : $profileIds[0];
                    $jobPost->company->employer = Profile::select('id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                        ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id')
                        ->where('profiles.id', $selectedProfileId)
                        ->first();
                    $jobPost->company->employer_id = $selectedProfileId;
                }
            } catch (\Exception $e) {
                \Log::error("Error parsing profile_id for company {$jobPost->company->id}: {$e->getMessage()}");
            }
        }
        $jobPost->skills_formatted = array_map(function ($skill, $rank) {
            return "{$skill} - {$rank}";
        }, $jobPost->skills ?? [], $jobPost->ranks ?? []);

        return response()->json($jobPost, 201);
    }

    public function show(JobPost $jobPost)
    {
        $jobPost->load([
            'company' => function ($query) {
                $query->select('id', 'company_name', 'profile_id', 'street', 'contact_number', 'city', 'province', 'postal_code', 'country', 'archived');
            },
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        if ($jobPost->company && $jobPost->company->profile_id) {
            try {
                $profileIds = json_decode($jobPost->company->profile_id, true);
                if (is_array($profileIds)) {
                    $selectedProfileId = in_array("3", $profileIds) ? "3" : $profileIds[0];
                    $jobPost->company->employer = Profile::select('id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                        ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id')
                        ->where('profiles.id', $selectedProfileId)
                        ->first();
                    $jobPost->company->employer_id = $selectedProfileId;
                }
            } catch (\Exception $e) {
                \Log::error("Error parsing profile_id for company {$jobPost->company->id}: {$e->getMessage()}");
            }
        }
        $jobPost->skills_formatted = array_map(function ($skill, $rank) {
            return "{$skill} - {$rank}";
        }, $jobPost->skills ?? [], $jobPost->ranks ?? []);

        return response()->json($jobPost);
    }

    public function update(Request $request, JobPost $jobPost)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'profile_id' => [
                'required',
                'exists:profiles,id',
                function ($attribute, $value, $fail) use ($request) {
                    $company = Company::find($request->company_id);
                    if ($company && $company->profile_id) {
                        try {
                            $profileIds = json_decode($company->profile_id, true);
                            if (!is_array($profileIds) || !in_array((string)$value, $profileIds)) {
                                $fail('The profile_id must match one of the company\'s profile IDs.');
                            }
                        } catch (\Exception $e) {
                            $fail('Invalid company profile_id format.');
                        }
                    }
                },
            ],
            'skills' => 'required|array',
            'ranks' => 'required|array',
            'description' => 'required|string',
            'salary' => 'nullable|numeric|min:1',
            'job_type' => 'required|in:full-time,part-time,contract,temporary',
            'street' => 'nullable|string',
            'city' => 'required|string',
            'province' => 'required|string',
            'postal_code' => 'required|string',
            'country' => 'required|string',
            'application_start' => 'required|date',
            'application_deadline' => 'required|date|after:application_start',
            'archived' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $jobPost->update([
            'company_id' => $validated['company_id'],
            'profile_id' => $validated['profile_id'],
            'skills' => $validated['skills'],
            'ranks' => $validated['ranks'],
            'description' => $validated['description'],
            'salary' => $validated['salary'],
            'job_type' => $validated['job_type'],
            'street' => $validated['street'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'postal_code' => $validated['postal_code'],
            'country' => $validated['country'],
            'application_start' => Carbon::parse($validated['application_start']),
            'application_deadline' => Carbon::parse($validated['application_deadline']),
            'archived' => $validated['archived'] ?? Carbon::parse($validated['application_deadline'])->isPast(),
        ]);

        $jobPost->load([
            'company' => function ($query) {
                $query->select('id', 'company_name', 'profile_id', 'street', 'contact_number', 'city', 'province', 'postal_code', 'country', 'archived');
            },
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        if ($jobPost->company && $jobPost->company->profile_id) {
            try {
                $profileIds = json_decode($jobPost->company->profile_id, true);
                if (is_array($profileIds)) {
                    $selectedProfileId = in_array("3", $profileIds) ? "3" : $profileIds[0];
                    $jobPost->company->employer = Profile::select('id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                        ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id')
                        ->where('profiles.id', $selectedProfileId)
                        ->first();
                    $jobPost->company->employer_id = $selectedProfileId;
                }
            } catch (\Exception $e) {
                \Log::error("Error parsing profile_id for company {$jobPost->company->id}: {$e->getMessage()}");
            }
        }
        $jobPost->skills_formatted = array_map(function ($skill, $rank) {
            return "{$skill} - {$rank}";
        }, $jobPost->skills ?? [], $jobPost->ranks ?? []);

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
            'company' => function ($query) {
                $query->select('id', 'company_name', 'profile_id', 'street', 'contact_number', 'city', 'province', 'postal_code', 'country', 'archived');
            },
            'profile' => function ($query) {
                $query->select('profiles.id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                      ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id');
            }
        ]);
        if ($jobPost->company && $jobPost->company->profile_id) {
            try {
                $profileIds = json_decode($jobPost->company->profile_id, true);
                if (is_array($profileIds)) {
                    $selectedProfileId = in_array("3", $profileIds) ? "3" : $profileIds[0];
                    $jobPost->company->employer = Profile::select('id', 'first_name', 'middlename', 'last_name', 'gender_id', 'suffix_id', 'suffixes.suffix_name')
                        ->leftJoin('suffixes', 'profiles.suffix_id', '=', 'suffixes.id')
                        ->where('profiles.id', $selectedProfileId)
                        ->first();
                    $jobPost->company->employer_id = $selectedProfileId;
                }
            } catch (\Exception $e) {
                \Log::error("Error parsing profile_id for company {$jobPost->company->id}: {$e->getMessage()}");
            }
        }
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
}
<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\Profile;
use App\Models\User;
use App\Models\Skill;
use App\Models\Rank;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class WorkerController extends Controller
{
    /**
     * Fetch all available workers.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if the requesting user is authenticated and get their role
            $authToken = $request->header('Authorization');
            $requestingUser = null;
            
            if ($authToken) {
                $token = str_replace('Bearer ', '', $authToken);
                $tokenData = \Laravel\Passport\Token::where('id', $token)->first();
                if ($tokenData) {
                    $requestingUser = User::find($tokenData->user_id);
                }
            }
            
            // Check if requesting user is a worker trying to browse other workers
            if ($requestingUser && $requestingUser->role_id == 1) {
                return response()->json([
                    'error' => 'Access denied',
                    'message' => 'Workers cannot browse other worker profiles. Please switch to employer role to hire workers.',
                    'requires_role_switch' => true
                ], 403);
            }
            
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);
            $status = $request->query('status', 'all');
            $excludeUserId = $request->query('exclude_user_id');

            $query = User::with(['profile', 'worker'])
                ->whereIn('users.role_id', [1, 2]) // Allow both workers (1) and employers (2)
                ->where('users.archived', false)
                ->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'ACCEPTED');
                    // $q->where('verified', true);
                });

            // Exclude specific user if provided
            if ($excludeUserId) {
                $query->where('users.id', '!=', $excludeUserId);
            }

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', ' like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%');
                })->orWhere('users.email', 'like', '%' . $search . '%');
            }

            // Filter by status
            if ($status !== 'all') {
                $query->whereHas('worker', function ($q) use ($status) {
                    switch ($status) {
                        case 'to_review':
                            $q->where(function ($subQ) {
                                $subQ->whereNull('is_reviewed')
                                     ->orWhere('is_reviewed', '')
                                     ->orWhere('is_reviewed', '0')
                                     ->orWhere('is_reviewed', 'TO BE REVIEWED');
                            });
                            break;
                        case 'accepted':
                            $q->where('is_reviewed', 'ACCEPTED');
                            break;
                        case 'declined':
                            $q->where('is_reviewed', 'DECLINED');
                            break;
                    }
                });
            }

            // Order by review status: TO BE REVIEWED first, then ACCEPTED, then DECLINED
            $query->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                  ->leftJoin('workers', 'profiles.id', '=', 'workers.profile_id')
                  ->orderByRaw("
                    CASE 
                        WHEN workers.is_reviewed IS NULL OR workers.is_reviewed = '' OR workers.is_reviewed = '0' OR workers.is_reviewed = 'TO BE REVIEWED' THEN 1
                        WHEN workers.is_reviewed = 'ACCEPTED' THEN 2
                        WHEN workers.is_reviewed = 'DECLINED' THEN 3
                        ELSE 4
                    END
                  ")
                  ->orderBy('users.created_at', 'desc')
                  ->select('users.*');

                $workers = $query->paginate($limit, ['*'], 'page', $page);

            foreach ($workers as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Worker',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                    $user->load('profile');
                }
                if (!$user->worker && $user->profile) {
                    Worker::create([
                        'profile_id' => $user->profile->id,
                        'work_type' => 'part-time',
                        'skills_id' => [],
                        'credentials_name' => [],
                        'archived' => false,
                    ]);
                    $user->load('worker');
                }
            }

            $response = [
                'workers' => collect($workers->items())->map(function ($user) {
                    return $this->formatWorker($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $workers->currentPage(),
                    'totalPages' => $workers->lastPage(),
                    'totalItems' => $workers->total(),
                ],
            ];

            Log::info('Fetched active workers with role_id = 1', [
                'count' => $workers->count(),
                'page' => $page,
                'limit' => $limit,
                'total' => $workers->total(),
            ]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch all workers for admin interface.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);
            $status = $request->query('status', 'all');
            $excludeUserId = $request->query('exclude_user_id');

            $query = User::with(['profile', 'worker'])
                ->whereIn('users.role_id', [1, 2]) // Allow both workers (1) and employers (2)
                ->where('users.archived', false)
                ->whereHas('worker'); // Show all workers, not just ACCEPTED ones

            // Exclude specific user if provided
            if ($excludeUserId) {
                $query->where('users.id', '!=', $excludeUserId);
            }

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', ' like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%');
                })->orWhere('users.email', 'like', '%' . $search . '%');
            }

            // Filter by status
            if ($status !== 'all') {
                $query->whereHas('worker', function ($q) use ($status) {
                    switch ($status) {
                        case 'to_review':
                            $q->where(function ($subQ) {
                                $subQ->whereNull('is_reviewed')
                                     ->orWhere('is_reviewed', '')
                                     ->orWhere('is_reviewed', '0')
                                     ->orWhere('is_reviewed', 'TO BE REVIEWED');
                            });
                            break;
                        case 'accepted':
                            $q->where('is_reviewed', 'ACCEPTED');
                            break;
                        case 'declined':
                            $q->where('is_reviewed', 'DECLINED');
                            break;
                    }
                });
            }

            // Order by review status: TO BE REVIEWED first, then ACCEPTED, then DECLINED
            $query->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                  ->leftJoin('workers', 'profiles.id', '=', 'workers.profile_id')
                  ->orderByRaw("
                    CASE 
                        WHEN workers.is_reviewed IS NULL OR workers.is_reviewed = '' OR workers.is_reviewed = '0' OR workers.is_reviewed = 'TO BE REVIEWED' THEN 1
                        WHEN workers.is_reviewed = 'ACCEPTED' THEN 2
                        WHEN workers.is_reviewed = 'DECLINED' THEN 3
                        ELSE 4
                    END
                  ")
                  ->orderBy('users.created_at', 'desc')
                  ->select('users.*');

                $workers = $query->paginate($limit, ['*'], 'page', $page);

            foreach ($workers as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Worker',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                    $user->load('profile');
                }
                if (!$user->worker && $user->profile) {
                    Worker::create([
                        'profile_id' => $user->profile->id,
                        'work_type' => 'part-time',
                        'skills_id' => [],
                        'credentials_name' => [],
                        'archived' => false,
                    ]);
                    $user->load('worker');
                }
            }

            $response = [
                'workers' => collect($workers->items())->map(function ($user) {
                    return $this->formatWorker($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $workers->currentPage(),
                    'totalPages' => $workers->lastPage(),
                    'totalItems' => $workers->total(),
                ],
            ];

            Log::info('Fetched workers for admin interface', [
                'count' => $workers->count(),
                'page' => $page,
                'limit' => $limit,
                'total' => $workers->total(),
            ]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching workers for admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch archived workers.
     */
    public function archived(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);
            $status = $request->query('status', 'all');

            $query = User::with(['profile', 'worker'])
                ->where('users.role_id', 1)
                ->where('users.archived', true);

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', 'like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%');
                })->orWhere('users.email', 'like', '%' . $search . '%');
            }

            // Filter by status
            if ($status !== 'all') {
                $query->whereHas('worker', function ($q) use ($status) {
                    switch ($status) {
                        case 'to_review':
                            $q->where(function ($subQ) {
                                $subQ->whereNull('is_reviewed')
                                     ->orWhere('is_reviewed', '')
                                     ->orWhere('is_reviewed', '0')
                                     ->orWhere('is_reviewed', 'TO BE REVIEWED');
                            });
                            break;
                        case 'accepted':
                            $q->where('is_reviewed', 'ACCEPTED');
                            break;
                        case 'declined':
                            $q->where('is_reviewed', 'DECLINED');
                            break;
                    }
                });
            }

            // Order by review status: TO BE REVIEWED first, then ACCEPTED, then DECLINED
            $query->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                  ->leftJoin('workers', 'profiles.id', '=', 'workers.profile_id')
                  ->orderByRaw("
                    CASE 
                        WHEN workers.is_reviewed IS NULL OR workers.is_reviewed = '' OR workers.is_reviewed = '0' OR workers.is_reviewed = 'TO BE REVIEWED' THEN 1
                        WHEN workers.is_reviewed = 'ACCEPTED' THEN 2
                        WHEN workers.is_reviewed = 'DECLINED' THEN 3
                        ELSE 4
                    END
                  ")
                  ->orderBy('users.created_at', 'desc')
                  ->select('users.*');

            $workers = $query->paginate($limit, ['*'], 'page', $page);

            foreach ($workers as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Worker',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                    $user->load('profile');
                }
                if (!$user->worker && $user->profile) {
                    Worker::create([
                        'profile_id' => $user->profile->id,
                        'work_type' => 'part-time',
                        'skills_id' => [],
                        'credentials_name' => [],
                        'archived' => true,
                    ]);
                    $user->load('worker');
                }
            }

            $response = [
                'workers' => collect($workers->items())->map(function ($user) {
                    return $this->formatWorker($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $workers->currentPage(),
                    'totalPages' => $workers->lastPage(),
                    'totalItems' => $workers->total(),
                ],
            ];

            Log::info('Fetched archived workers with role_id = 1', [
                'count' => $workers->count(),
                'page' => $page,
                'limit' => $limit,
                'total' => $workers->total(),
            ]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch archived workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch a specific worker by ID.
     */
    public function show($id, Request $request): JsonResponse
    {
        try {
            // Check if the requesting user is authenticated and get their role
            $authToken = $request->header('Authorization');
            $requestingUser = null;
            
            if ($authToken) {
                $token = str_replace('Bearer ', '', $authToken);
                $tokenData = \Laravel\Passport\Token::where('id', $token)->first();
                if ($tokenData) {
                    $requestingUser = User::find($tokenData->user_id);
                }
            }
            
            // First try to find user with role_id 1 or 2 (workers and employers with worker profiles)
            $user = User::with(['profile', 'worker'])
                ->whereIn('role_id', [1, 2])
                ->find($id);
            
            // If not found, try to find user who has worker data (even if role_id changed)
            if (!$user) {
                $user = User::with(['profile', 'worker'])
                    ->whereHas('worker')
                    ->find($id);
            }
            
            // If still not found, throw 404
            if (!$user) {
                throw new \Exception("User not found or not a worker");
            }
            
            // Check if requesting user is a worker trying to view another worker's profile
            if ($requestingUser && $requestingUser->role_id == 1 && $requestingUser->id != $id) {
                return response()->json([
                    'error' => 'Access denied',
                    'message' => 'Workers cannot view other worker profiles. Please switch to employer role to hire workers.',
                    'requires_role_switch' => true
                ], 403);
            }

            if (!$user->profile) {
                $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => 'Unknown',
                    'last_name' => 'Worker',
                    'email' => $user->email,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                ]);
                $user->load('profile');
            }
            if (!$user->worker && $user->profile) {
                Worker::create([
                    'profile_id' => $user->profile->id,
                    'work_type' => 'part-time',
                    'skills_id' => [],
                    'credentials_name' => [],
                    'archived' => $user->archived,
                ]);
                $user->load('worker');
            }

            Log::info('Fetched worker (current or former)', ['id' => $id, 'role_id' => $user->role_id]);
            return response()->json($this->formatWorker($user), 200);
        } catch (\Exception $e) {
            Log::error('Error fetching worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Worker not found: ' . $e->getMessage()], 404);
        }
    }

    /**
     * Create a new worker.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Store worker request data', ['input' => $request->all()]);

            $skillsId = $request->input('skills_id', []);
            if (is_string($skillsId)) {
                $decoded = json_decode($skillsId, true);
                $skillsId = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($skillsId)) {
                Log::warning('skills_id is not an array', ['skills_id' => $request->input('skills_id')]);
                return response()->json(['errors' => ['skills_id' => ['The skills id must be an array.']]], 400);
            }

            // Parse preferred_working_days if it's a JSON string
            $preferredWorkingHours = $request->preferred_working_days;
            if (is_string($preferredWorkingHours)) {
                $preferredWorkingHours = json_decode($preferredWorkingHours, true);
            }
            // Ensure it's always an array
            if (!is_array($preferredWorkingHours)) {
                $preferredWorkingHours = [];
            }

            $validator = Validator::make(
                array_merge($request->all(), ['skills_id' => $skillsId, 'preferred_working_days' => $preferredWorkingHours]),
                [
                    'first_name' => 'required|string|max:255',
                    'middlename' => 'nullable|string|max:255',
                    'last_name' => 'required|string|max:255',
                    'suffix_id' => 'nullable|integer|exists:suffixes,id',
                    'email' => 'required|email|max:255|unique:users,email',
                    'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                    'gender_id' => 'required|integer|exists:genders,id',
                    'contact_number' => 'nullable|string|max:20|regex:/^\+?[\d\s-]{7,20}$/',
                    'street' => 'nullable|string|max:255',
                    'work_type' => 'required|in:part-time,full-time,one-time',
                    'hours_per_day' => 'nullable|integer|min:1|max:24',
                    'preferred_working_hours' => 'nullable|array',
                    'preferred_working_hours.*' => 'string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                    'preferred_working_days' => 'nullable|array',
                    'preferred_working_days.*' => 'string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                    'bio' => 'nullable|string|max:1000',
                    'skills_id' => 'required|array|min:1',
                    'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                    'skills_id.*.skill_name' => 'required|string|max:255',
                    'skills_id.*.sub_skills' => 'nullable|array',
                    'skills_id.*.sub_skills.*' => 'string|max:255',
                    'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                    'credentials' => 'nullable|array',
                    'credentials.*.credentials_name' => 'required|string|max:255',
                    'credentials.*.credentials_photo' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:2048',
                    'credentials.*.credentials_doc' => 'nullable|file|mimes:pdf,doc,docx|max:2048',
                    'is_reviewed' => 'nullable|string|in:TO BE REVIEWED,ACCEPTED,DECLINED',
                ]
            );

            if ($validator->fails()) {
                Log::warning('Validation failed for worker creation', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $skillIds = array_column($skillsId, 'skill_id');
            if (count(array_unique($skillIds)) !== count($skillIds)) {
                return response()->json(['errors' => ['skills_id' => ['Duplicate skill IDs are not allowed']]], 400);
            }

            foreach ($skillsId as $index => $skillData) {
                $skill = Skill::find($skillData['skill_id']);
                if ($skill && !empty($skillData['sub_skills'])) {
                    $availableSubSkills = $this->parseSubSkills($skill->sub_skills);
                    foreach ($skillData['sub_skills'] as $subSkill) {
                        if (!in_array($subSkill, $availableSubSkills)) {
                            return response()->json([
                                'errors' => ["skills_id.$index.sub_skills" => ["Invalid sub-skill: $subSkill"]],
                            ], 400);
                        }
                    }
                }
            }

            $user = User::create([
                'username' => $request->username ?? strtolower($request->first_name . '.' . $request->last_name),
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role_id' => 1,
                'archived' => false,
            ]);

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'middlename' => $request->middlename,
                'last_name' => $request->last_name,
                'suffix_id' => $request->suffix_id,
                'gender_id' => $request->gender_id,
                'contact_number' => $request->contact_number,
                'street' => $request->street,
                'city' => 'Butuan City',
                'province' => 'Agusan Del Norte',
                'postal_code' => '8600',
                'country' => 'Philippines',
            ];

            if ($request->hasFile('profile_img')) {
                $file = $request->file('profile_img');
                $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('profiles', $filename, 'public');
                $profileData['profile_img'] = $path;
            }

            $profile = Profile::create($profileData);

            Log::info("Credentials data received", [
                'has_credentials' => $request->has('credentials'),
                'credentials_data' => $request->input('credentials'),
                'all_files' => $request->allFiles()
            ]);
            
            $credentials_name = [];
            $credentials_photo = [];
            $credentials_doc = [];
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (
                        isset($credential['credentials_name']) &&
                        !empty($credential['credentials_name']) &&
                        !empty($credential['credentials_name'])
                    ) {
                        $credentials_name[] = $credential['credentials_name'];
                        
                        // Handle file upload and determine if it's photo or document
                        if ($request->hasFile("credentials.{$index}.credentials_photo")) {
                            $file = $request->file("credentials.{$index}.credentials_photo");
                            $fileExtension = strtolower($file->getClientOriginalExtension());
                            $mimeType = $file->getMimeType();
                            
                            Log::info("Processing credential file", [
                                'index' => $index,
                                'original_name' => $file->getClientOriginalName(),
                                'extension' => $fileExtension,
                                'mime_type' => $mimeType,
                                'size' => $file->getSize()
                            ]);
                            
                            // Check if it's an image file
                            if (in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif', 'webp']) || 
                                str_starts_with($mimeType, 'image/')) {
                                // Store as photo
                                $photoPath = $file->store('credentials/photos', 'public');
                                $credentials_photo[] = $photoPath;
                                $credentials_doc[] = null;
                                Log::info("Stored as photo", ['path' => $photoPath]);
                            } else {
                                // Store as document
                                $docPath = $file->store('credentials/documents', 'public');
                                $credentials_doc[] = $docPath;
                                $credentials_photo[] = null;
                                Log::info("Stored as document", ['path' => $docPath]);
                            }
                        } else {
                            $credentials_photo[] = null;
                            $credentials_doc[] = null;
                        }
                    }
                }
            }

            // Parse preferred_working_days if it's a JSON string
            $preferredWorkingHours = $request->preferred_working_days;
            if (is_string($preferredWorkingHours)) {
                $preferredWorkingHours = json_decode($preferredWorkingHours, true);
            }
            // Ensure it's always an array
            if (!is_array($preferredWorkingHours)) {
                $preferredWorkingHours = [];
            }
            // Ensure it's always an array
            if (!is_array($preferredWorkingHours)) {
                $preferredWorkingHours = [];
            }

            Log::info("Final credentials data before worker creation", [
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'credentials_doc' => $credentials_doc
            ]);

            $worker = Worker::create([
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'hours_per_day' => $request->hours_per_day,
                'preferred_working_hours' => $preferredWorkingHours,
                'preferred_working_days' => $preferredWorkingHours,
                'bio' => $request->bio,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'credentials_doc' => $credentials_doc,
                'archived' => false,
                'is_reviewed' => $request->is_reviewed,
            ]);

            Log::info('Worker created', [
                'worker_id' => $worker->id,
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
            ]);

            return response()->json([
                'message' => 'Worker created successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to create worker: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing worker.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Update worker request data', ['id' => $id, 'input' => $request->all()]);

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            if (!$user->profile) {
                $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name ?? 'Unknown',
                    'last_name' => $request->last_name ?? 'Worker',
                    'email' => $user->email,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                ]);
                $user->load('profile');
            }

            if (!$user->worker) {
                Worker::create([
                    'profile_id' => $user->profile->id,
                    'work_type' => $request->work_type ?? 'part-time',
                    'skills_id' => [],
                    'credentials_name' => [],
                    'archived' => $user->archived,
                    'is_reviewed' => '0',
                ]);
                $user->load('worker');
            }

            $skillsId = $request->input('skills_id', []);
            if (is_string($skillsId)) {
                $decoded = json_decode($skillsId, true);
                $skillsId = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($skillsId)) {
                Log::warning('skills_id is not an array', ['skills_id' => $request->input('skills_id')]);
                return response()->json(['errors' => ['skills_id' => ['The skills id must be an array.']]], 400);
            }

            // Parse preferred_working_days if it's a JSON string
            $preferredWorkingHours = $request->preferred_working_days;
            if (is_string($preferredWorkingHours)) {
                $preferredWorkingHours = json_decode($preferredWorkingHours, true);
            }
            // Ensure it's always an array
            if (!is_array($preferredWorkingHours)) {
                $preferredWorkingHours = [];
            }

            $validator = Validator::make(
                array_merge($request->all(), ['skills_id' => $skillsId, 'preferred_working_days' => $preferredWorkingHours]),
                [
                    'first_name' => 'required|string|max:255',
                    'middlename' => 'nullable|string|max:255',
                    'last_name' => 'required|string|max:255',
                    'suffix_id' => 'nullable|integer|exists:suffixes,id',
                    'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
                    'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                    'gender_id' => 'required|integer|exists:genders,id',
                    'contact_number' => 'nullable|string|max:20|regex:/^\+?[\d\s-]{7,20}$/',
                    'street' => 'nullable|string|max:255',
                    'work_type' => 'required|in:part-time,full-time,one-time-job',
                    'hours_per_day' => 'nullable|integer|min:1|max:24',
                    'preferred_working_hours' => 'nullable|array',
                    'preferred_working_hours.*' => 'string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                    'preferred_working_days' => 'nullable|array',
                    'preferred_working_days.*' => 'string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                    'bio' => 'nullable|string|max:1000',
                    'skills_id' => 'required|array|min:1',
                    'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                    'skills_id.*.skill_name' => 'required|string|max:255',
                    'skills_id.*.sub_skills' => 'nullable|array',
                    'skills_id.*.sub_skills.*' => 'string|max:255',
                    'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                    'credentials' => 'nullable|array',
                    'credentials.*.credentials_name' => 'required|string|max:255',
                    'credentials.*.credentials_photo' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:2048',
                    'credentials.*.credentials_doc' => 'nullable|file|mimes:pdf,doc,docx|max:2048',
                    'is_reviewed' => 'nullable|string|in:TO BE REVIEWED,ACCEPTED,DECLINED',
                ]
            );

            if ($validator->fails()) {
                Log::warning('Validation failed for worker update', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $skillIds = array_column($skillsId, 'skill_id');
            if (count(array_unique($skillIds)) !== count($skillIds)) {
                return response()->json(['errors' => ['skills_id' => ['Duplicate skill IDs are not allowed']]], 400);
            }

            foreach ($skillsId as $index => $skillData) {
                $skill = Skill::find($skillData['skill_id']);
                if ($skill && !empty($skillData['sub_skills'])) {
                    $availableSubSkills = $this->parseSubSkills($skill->sub_skills);
                    foreach ($skillData['sub_skills'] as $subSkill) {
                        if (!in_array($subSkill, $availableSubSkills)) {
                            return response()->json([
                                'errors' => ["skills_id.$index.sub_skills" => ["Invalid sub-skill: $subSkill"]],
                            ], 400);
                        }
                    }
                }
            }

            $user->update([
                'username' => $request->username ?? $user->username,
                'email' => $request->email,
                'password' => $request->password ? bcrypt($request->password) : $user->password,
            ]);

            $profileData = [
                'first_name' => $request->first_name,
                'middlename' => $request->middlename,
                'last_name' => $request->last_name,
                'suffix_id' => $request->suffix_id,
                'gender_id' => $request->gender_id,
                'contact_number' => $request->contact_number,
                'street' => $request->street,
                'city' => $request->city ?? $user->profile->city,
                'province' => $request->province ?? $user->profile->province,
                'postal_code' => $request->postal_code ?? $user->profile->postal_code,
                'country' => $request->country ?? $user->profile->country,
            ];

            if ($request->hasFile('profile_img')) {
                if ($user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }
                $file = $request->file('profile_img');
                $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('profiles', $filename, 'public');
                $profileData['profile_img'] = $path;
            } elseif ($request->input('profile_img') === '' && $user->profile->profile_img) {
                if (Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }
                $profileData['profile_img'] = null;
            }

            $user->profile->update($profileData);

            $credentials_name = [];
            $existing_credentials_name = $this->parseArray($user->worker->credentials_name);

            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        $credentials_name[] = $credential['credentials_name'];
                    }
                }

            }

            // Handle credentials_photo and credentials_doc arrays
            $credentials_photo = [];
            $credentials_doc = [];
            
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        // Handle credentials_photo file upload
                        if ($request->hasFile("credentials.{$index}.credentials_photo")) {
                            $photoFile = $request->file("credentials.{$index}.credentials_photo");
                            $photoPath = $photoFile->store('credentials/photos', 'public');
                            $credentials_photo[] = $photoPath;
                        } else {
                            $credentials_photo[] = null;
                        }
                        
                        // Handle credentials_doc file upload
                        if ($request->hasFile("credentials.{$index}.credentials_doc")) {
                            $docFile = $request->file("credentials.{$index}.credentials_doc");
                            $docPath = $docFile->store('credentials/documents', 'public');
                            $credentials_doc[] = $docPath;
                        } else {
                            $credentials_doc[] = null;
                        }
                    }
                }
            }

            $user->worker->update([
                'work_type' => $request->work_type,
                'hours_per_day' => $request->hours_per_day,
                'preferred_working_hours' => $preferredWorkingHours,
                'preferred_working_days' => $preferredWorkingHours,
                'bio' => $request->bio,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'credentials_doc' => $credentials_doc,
                'is_reviewed' => $request->input('is_reviewed', $user->worker->is_reviewed),
                'archived' => $user->archived,
            ]);

            Log::info('Worker updated', [
                'worker_id' => $user->worker->id,
                'work_type' => $request->work_type,
                'hours_per_day' => $request->hours_per_day,
                'preferred_working_hours' => $preferredWorkingHours,
                'preferred_working_days' => $preferredWorkingHours,
                'bio' => $request->bio,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
            ]);

            return response()->json([
                'message' => 'Worker updated successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update worker: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update worker's skills.
     */
    public function updateSkills(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Update skills request data', ['id' => $id, 'input' => $request->all()]);

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            if (!$user->worker) {
                return response()->json(['error' => 'Worker record not found'], 404);
            }

            $skillsId = $request->input('skills_id', []);
            if (is_string($skillsId)) {
                $decoded = json_decode($skillsId, true);
                $skillsId = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($skillsId)) {
                Log::warning('skills_id is not an array', ['skills_id' => $request->input('skills_id')]);
                return response()->json(['errors' => ['skills_id' => ['The skills id must be an array.']]], 400);
            }

            // Handle structured skills_id format
            $primarySkills = $skillsId['primary_skills'] ?? [];
            $additionalSkills = $skillsId['additional_skills'] ?? [];
            $allSkills = array_merge($primarySkills, $additionalSkills);
            
            // Ensure arrays are always present
            if (!isset($skillsId['primary_skills'])) {
                $skillsId['primary_skills'] = [];
            }
            if (!isset($skillsId['additional_skills'])) {
                $skillsId['additional_skills'] = [];
            }
            
            Log::info('Processing skills update', [
                'worker_id' => $user->worker->id,
                'primary_skills_count' => count($primarySkills),
                'additional_skills_count' => count($additionalSkills),
                'total_skills' => count($allSkills),
                'skills_id_structure' => $skillsId
            ]);

            // Custom validation for structured skills_id
            $validator = Validator::make(
                ['skills_id' => $skillsId],
                [
                    'skills_id' => 'required|array',
                    'skills_id.primary_skills' => 'array',
                    'skills_id.additional_skills' => 'array',
                ]
            );

            // Validate individual skills if arrays are not empty
            if (!empty($primarySkills)) {
                $validator->sometimes('skills_id.primary_skills.*.skill_id', 'required|integer|exists:skills,id', function ($input) {
                    return !empty($input->skills_id['primary_skills']);
                });
                $validator->sometimes('skills_id.primary_skills.*.skill_name', 'required|string|max:255', function ($input) {
                    return !empty($input->skills_id['primary_skills']);
                });
                $validator->sometimes('skills_id.primary_skills.*.sub_skills', 'nullable|array', function ($input) {
                    return !empty($input->skills_id['primary_skills']);
                });
                $validator->sometimes('skills_id.primary_skills.*.sub_skills.*', 'string|max:255', function ($input) {
                    return !empty($input->skills_id['primary_skills']);
                });
            }

            if (!empty($additionalSkills)) {
                $validator->sometimes('skills_id.additional_skills.*.skill_id', 'required|integer|exists:skills,id', function ($input) {
                    return !empty($input->skills_id['additional_skills']);
                });
                $validator->sometimes('skills_id.additional_skills.*.skill_name', 'required|string|max:255', function ($input) {
                    return !empty($input->skills_id['additional_skills']);
                });
                $validator->sometimes('skills_id.additional_skills.*.sub_skills', 'nullable|array', function ($input) {
                    return !empty($input->skills_id['additional_skills']);
                });
                $validator->sometimes('skills_id.additional_skills.*.sub_skills.*', 'string|max:255', function ($input) {
                    return !empty($input->skills_id['additional_skills']);
                });
            }

            if ($validator->fails()) {
                Log::warning('Validation failed for skills update', [
                    'errors' => $validator->errors()->toArray(),
                    'input_data' => $skillsId,
                    'primary_skills' => $primarySkills,
                    'additional_skills' => $additionalSkills
                ]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $skillIds = array_column($allSkills, 'skill_id');
            if (count(array_unique($skillIds)) !== count($skillIds)) {
                return response()->json(['errors' => ['skills_id' => ['Duplicate skill IDs are not allowed']]], 400);
            }

            foreach ($allSkills as $index => $skillData) {
                $skill = Skill::find($skillData['skill_id']);
                if ($skill && !empty($skillData['sub_skills'])) {
                    $availableSubSkills = $this->parseSubSkills($skill->sub_skills);
                    foreach ($skillData['sub_skills'] as $subSkill) {
                        if (!in_array($subSkill, $availableSubSkills)) {
                            return response()->json([
                                'errors' => ["skills_id.$index.sub_skills" => ["Invalid sub-skill: $subSkill"]],
                            ], 400);
                        }
                    }
                }
            }

            if (count($allSkills) > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $user->worker->id,
                    'total_skills' => count($allSkills),
                ]);
                return response()->json(['error' => 'Cannot have more than 15 skills'], 400);
            }

            // Ensure the final structure has both arrays
            $finalSkillsId = [
                'primary_skills' => $primarySkills,
                'additional_skills' => $additionalSkills,
            ];
            
            $user->worker->update([
                'skills_id' => $finalSkillsId,
            ]);

            Log::info('Worker skills updated', [
                'worker_id' => $user->worker->id,
                'skills_id' => $finalSkillsId,
                'total_skills' => count($allSkills),
            ]);

            return response()->json([
                'message' => 'Worker skills updated successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating worker skills: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update worker skills: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update worker's archive status.
     */
    public function updateArchiveStatus(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'archived' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for archive status update', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            $newStatus = $request->input('archived');
            if ($user->archived === $newStatus) {
                return response()->json(['error' => 'Worker is already ' . ($newStatus ? 'archived' : 'restored')], 400);
            }

            $user->update(['archived' => $newStatus]);

            if ($user->worker) {
                $user->worker->update(['archived' => $newStatus]);
            }

            Log::info('Worker archive status updated', ['id' => $id, 'archived' => $newStatus]);
            return response()->json(['message' => 'Worker ' . ($newStatus ? 'archived' : 'restored') . ' successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error updating worker archive status: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update worker archive status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk archive or restore workers.
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array',
                'worker_ids.*' => 'integer|exists:users,id',
                'archived' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk archive', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);
            $archived = $request->input('archived');

            $users = User::whereIn('id', $ids)
                ->where('role_id', 1)
                ->where('users.archived', !$archived)
                ->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No valid workers found for ' . ($archived ? 'archiving' : 'restoring')], 400);
            }

            foreach ($users as $user) {
                $user->update(['archived' => $archived]);
                if ($user->worker) {
                    $user->worker->update(['archived' => $archived]);
                }
            }

            Log::info('Workers bulk updated', ['ids' => $ids, 'archived' => $archived]);
            return response()->json(['message' => 'Workers ' . ($archived ? 'archived' : 'restored') . ' successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk updating workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Add a skill to the worker's skills_id array.
     */
    public function addSkill(Request $request): JsonResponse
    {
        try {
            Log::info('Add skill request data', ['input' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'skill_id' => 'required|integer|exists:skills,id',
                'skill_name' => 'required|string|max:255',
                'sub_skills' => 'nullable|array',
                'sub_skills.*' => 'string|max:255',
                'experience' => 'nullable|string|in:no-experience,0-11-months,1-2-years,2-5-years,5-10-years,10+ years',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for adding skill', [
                    'errors' => $validator->errors()->toArray(),
                    'request' => $request->all(),
                ]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $profileId = $request->profile_id;
            $skillId = $request->skill_id;
            $skill = Skill::findOrFail($skillId);
            $subSkills = $request->sub_skills ?? [];

            if (!empty($subSkills)) {
                $availableSubSkills = $this->parseSubSkills($skill->sub_skills);
                foreach ($subSkills as $subSkill) {
                    if (!in_array($subSkill, $availableSubSkills)) {
                        return response()->json([
                            'errors' => ['sub_skills' => ["Invalid sub-skill: $subSkill"]],
                        ], 400);
                    }
                }
            }

            $worker = Worker::firstOrCreate(
                ['profile_id' => $profileId],
                [
                    'work_type' => 'part-time',
                    'skills_id' => [],
                    'credentials_name' => [],
                    'archived' => false,
                    'is_reviewed' => '0',
                ]
            );

            $skillsId = $this->parseArray($worker->skills_id);

            if (in_array($skillId, array_column($skillsId, 'skill_id'))) {
                Log::info('Skill already exists for worker', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'skill_id' => $skillId,
                ]);
                return response()->json(['message' => 'Skill already added'], 200);
            }

            $skillsId[] = [
                'skill_id' => (string)$skillId,
                'skill_name' => $request->skill_name,
                'sub_skills' => $subSkills,
                'experience' => $request->experience ?? '0-11-months',
            ];

            if (count($skillsId) > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'total_skills' => count($skillsId),
                ]);
                return response()->json(['error' => 'Cannot add more than 15 skills'], 400);
            }

            $worker->update([
                'skills_id' => $skillsId,
            ]);

            $user = User::whereHas('profile', function ($query) use ($profileId) {
                $query->where('id', $profileId);
            })->with(['profile', 'worker'])->first();

            Log::info('Skill added to worker', [
                'worker_id' => $worker->id,
                'profile_id' => $profileId,
                'skill_id' => $skillId,
                'skill_name' => $request->skill_name,
                'sub_skills' => $subSkills,
            ]);

            return response()->json([
                'message' => 'Skill added successfully',
                'worker' => $this->formatWorker($user),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error adding skill to worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to add skill: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove a skill from worker profile.
     */
    public function removeSkill(Request $request): JsonResponse
    {
        try {
            Log::info('Remove skill request data', ['input' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'skill_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for removing skill', [
                    'errors' => $validator->errors()->toArray(),
                    'request' => $request->all(),
                ]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $profileId = $request->profile_id;
            $skillId = (string)$request->skill_id;

            $worker = Worker::where('profile_id', $profileId)->first();

            if (!$worker) {
                return response()->json(['error' => 'Worker record not found'], 404);
            }

            $skillsId = $this->parseArray($worker->skills_id);
            
            Log::info('Attempting to remove skill', [
                'worker_id' => $worker->id,
                'profile_id' => $profileId,
                'skill_id_to_remove' => $skillId,
                'current_skills' => $skillsId,
                'skill_ids_in_array' => array_column($skillsId, 'skill_id')
            ]);
            
            // Find and remove the skill
            $originalCount = count($skillsId);
            $skillsId = array_filter($skillsId, function($skill) use ($skillId) {
                $skillIdInArray = (string)$skill['skill_id'];
                $isMatch = $skillIdInArray === $skillId;
                Log::info('Comparing skill IDs', [
                    'skill_id_to_remove' => $skillId,
                    'skill_id_in_array' => $skillIdInArray,
                    'is_match' => $isMatch
                ]);
                return !$isMatch;
            });
            
            // Re-index the array
            $skillsId = array_values($skillsId);

            if (count($skillsId) === $originalCount) {
                Log::info('Skill not found in worker skills', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'skill_id' => $skillId,
                    'available_skill_ids' => array_column($this->parseArray($worker->skills_id), 'skill_id')
                ]);
                return response()->json(['message' => 'Skill not found in worker profile'], 404);
            }

            $worker->update([
                'skills_id' => $skillsId,
            ]);

            $user = User::whereHas('profile', function ($query) use ($profileId) {
                $query->where('id', $profileId);
            })->with(['profile', 'worker'])->first();

            Log::info('Skill removed from worker', [
                'worker_id' => $worker->id,
                'profile_id' => $profileId,
                'skill_id' => $skillId,
                'remaining_skills' => count($skillsId),
            ]);

            return response()->json([
                'message' => 'Skill removed successfully',
                'worker' => $this->formatWorker($user),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error removing skill from worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to remove skill: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk review workers.
     */
    public function bulkReview(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array',
                'worker_ids.*' => 'integer|exists:users,id',
                'is_reviewed' => 'required|in:ACCEPTED,DECLINED',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk review', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);
            $status = $request->input('is_reviewed');

            $users = User::whereIn('id', $ids)
                ->where('role_id', 1)
                ->with(['worker'])
                ->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No valid workers found for review'], 400);
            }

            $updatedCount = 0;
            foreach ($users as $user) {
                if ($user->worker && $user->worker->is_reviewed !== $status) {
                    // Only update if status is different and worker is pending review
                    if (in_array($user->worker->is_reviewed, [null, '', '0', 'TO BE REVIEWED'])) {
                        $user->worker->update(['is_reviewed' => $status]);
                        $updatedCount++;
                        
                        // Send notification to worker about review decision
                        if ($status === 'ACCEPTED') {
                            NotificationController::createNotification(
                                $user->id,
                                null, // Admin action, no specific sender
                                'review_approval',
                                'Profile Approved',
                                'Congratulations! Your worker profile has been approved by the admin. You can now receive bookings and job offers.',
                                $user->worker->id,
                                'worker'
                            );
                        } elseif ($status === 'DECLINED') {
                            NotificationController::createNotification(
                                $user->id,
                                null, // Admin action, no specific sender
                                'review_rejection',
                                'Profile Declined',
                                'Your worker profile has been declined. Please review your credentials and try again with updated information.',
                                $user->worker->id,
                                'worker'
                            );
                        }
                    }
                }
            }

            if ($updatedCount === 0) {
                return response()->json(['error' => 'No workers were updated. They may already have this status or are not pending review.'], 400);
            }

            Log::info('Workers bulk reviewed', ['ids' => $ids, 'is_reviewed' => $status, 'updated_count' => $updatedCount]);
            return response()->json(['message' => $updatedCount . ' workers ' . strtolower($status) . ' successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk reviewing workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to review workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete declined workers.
     */
    public function bulkDeleteDeclined(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array',
                'worker_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk delete declined', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);

            $users = User::whereIn('id', $ids)
                ->where('role_id', 1)
                ->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'DECLINED');
                })
                ->with(['profile', 'worker'])
                ->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No declined workers found for deletion'], 400);
            }

            $deletedCount = 0;
            foreach ($users as $user) {
                // Delete associated files
                if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }

                if ($user->worker) {
                    $credentialsPhoto = [];
            }

                // Delete the user and related records (cascade will handle profile and worker)
                $user->delete();
                $deletedCount++;
            }

            Log::info('Declined workers bulk deleted', ['ids' => $ids, 'deleted_count' => $deletedCount]);
            return response()->json(['message' => $deletedCount . ' declined workers deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting declined workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete declined workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete archived workers.
     */
    public function bulkDeleteArchived(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array',
                'worker_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk delete archived', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);

            $users = User::whereIn('id', $ids)
                ->where('role_id', 1)
                ->where('users.archived', true)
                ->with(['profile', 'worker'])
                ->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No archived workers found for deletion'], 400);
            }

            $deletedCount = 0;
            foreach ($users as $user) {
                // Delete associated files
                if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }

                if ($user->worker) {
                    $credentialsPhoto = [];
            }

                // Delete the user and related records (cascade will handle profile and worker)
                $user->delete();
                $deletedCount++;
            }

            Log::info('Archived workers bulk deleted', ['ids' => $ids, 'deleted_count' => $deletedCount]);
            return response()->json(['message' => $deletedCount . ' archived workers deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting archived workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete archived workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a single worker.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            // Delete associated files
            if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                Storage::disk('public')->delete($user->profile->profile_img);
            }

            if ($user->worker) {
                $credentialsPhoto = [];
                foreach ($credentialsPhoto as $photo) {
                    if ($photo && Storage::disk('public')->exists($photo)) {
                        Storage::disk('public')->delete($photo);
                    }
                }
            }

            // Delete the user and related records (cascade will handle profile and worker)
            $user->delete();

            Log::info('Worker deleted', ['id' => $id]);
            return response()->json(['message' => 'Worker deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete worker: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update worker's review status.
     */
    public function review(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'is_reviewed' => 'required|in:ACCEPTED,DECLINED',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for review status update', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $user = User::with(['worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            if (!$user->worker) {
                return response()->json(['error' => 'Worker record not found'], 404);
            }

            $newStatus = $request->input('is_reviewed');
            if ($user->worker->is_reviewed === $newStatus) {
                return response()->json(['error' => 'Worker is already ' . strtolower($newStatus)], 400);
            }

            $user->worker->update(['is_reviewed' => $newStatus]);

            Log::info('Worker review status updated', ['id' => $id, 'is_reviewed' => $newStatus]);
            return response()->json([
                'message' => 'Worker review status updated successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating worker review status: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update worker review status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Parse a field to ensure it's an array, handling strings and JSON.
     */
    protected function parseArray($data): array
    {
        if (is_array($data)) {
            return $data;
        }
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
            Log::warning('Invalid JSON string in parseArray', ['data' => $data]);
            return [];
        }
        if ($data === null) {
            return [];
        }
        Log::warning('Unexpected data type in parseArray', ['data' => $data, 'type' => gettype($data)]);
        return [];
    }

    /**
     * Parse sub_skills field to ensure it's an array.
     */
    protected function parseSubSkills($subSkills): array
    {
        if (is_array($subSkills)) {
            return $subSkills;
        }
        if (is_string($subSkills)) {
            $decoded = json_decode($subSkills, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
            Log::warning('Invalid JSON sub_skills', ['sub_skills' => $subSkills]);
            return [];
        }
        if ($subSkills === null) {
            return [];
        }
        Log::warning('Unexpected sub_skills data type', ['sub_skills' => $subSkills, 'type' => gettype($subSkills)]);
        return [];
    }

    /**
     * Calculate worker rank based on experience and reviews.
     */
    protected function calculateWorkerRank($user)
    {
        if (!$user->worker) {
            return null;
        }

        $skillsId = $this->parseArray($user->worker->skills_id);
        $totalExperience = 0;
        $totalReviews = 0;
        $averageRating = 0;

        // Calculate total experience from skills
        if (is_array($skillsId)) {
            if (isset($skillsId['primary_skills']) && is_array($skillsId['primary_skills'])) {
                foreach ($skillsId['primary_skills'] as $skill) {
                    if (isset($skill['experience'])) {
                        $totalExperience += $this->convertExperienceToMonths($skill['experience']);
                    }
                }
            }
            if (isset($skillsId['additional_skills']) && is_array($skillsId['additional_skills'])) {
                foreach ($skillsId['additional_skills'] as $skill) {
                    if (isset($skill['experience'])) {
                        $totalExperience += $this->convertExperienceToMonths($skill['experience']);
                    }
                }
            }
        }

        // TODO: Add review calculation logic when reviews are implemented
        // For now, we'll use experience-based ranking

        // Get active ranks (archived = false)
        $ranks = Rank::where('archived', false)->orderBy('min_points', 'asc')->get();

        // If no ranks exist, return null to avoid errors
        if ($ranks->isEmpty()) {
            Log::warning('No ranks available in database');
            return null;
        }

        // Determine rank based on experience
        $selectedRank = null;
        foreach ($ranks as $rank) {
            if ($totalExperience >= $this->getExperienceThresholdForRank($rank->name)) {
                $selectedRank = $rank;
            }
        }

        // If no rank found, assign Bronze as default
        if (!$selectedRank) {
            $selectedRank = $ranks->where('name', 'Bronze')->first();
        }

        // If still no rank (Bronze doesn't exist), use the first available rank
        if (!$selectedRank && $ranks->isNotEmpty()) {
            $selectedRank = $ranks->first();
        }

        return $selectedRank;
    }

    /**
     * Convert experience string to months.
     */
    protected function convertExperienceToMonths($experience)
    {
        switch ($experience) {
            case '0-11-months':
                return 6; // Average of 0-11 months
            case '1-2-years':
                return 18; // Average of 1-2 years
            case '2-5-years':
                return 42; // Average of 2-5 years
            case '5-10-years':
                return 90; // Average of 5-10 years
            case '10+ years':
                return 120; // 10+ years
            default:
                return 0;
        }
    }

    /**
     * Get experience threshold for rank.
     */
    protected function getExperienceThresholdForRank($rankName)
    {
        switch ($rankName) {
            case 'Bronze':
                return 0; // 0-11 months
            case 'Silver':
                return 18; // 1-2 years
            case 'Gold':
                return 42; // 2-5 years
            case 'Diamond':
                return 90; // 5-10 years
            default:
                return 0;
        }
    }

    /**
     * Format worker data for response.
     */
    protected function formatWorker($user)
    {
        if (!$user->worker) {
            Log::warning('Worker record missing for user', ['user_id' => $user->id]);
            return [
                'id' => $user->id,
                'email' => $user->email,
                'archived' => $user->archived,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'profile' => $user->profile ? [
                    'first_name' => $user->profile->first_name,
                    'middlename' => $user->profile->middlename,
                    'last_name' => $user->profile->last_name,
                    'suffix_id' => $user->profile->suffix_id ? (string)$user->profile->suffix_id : null,
                    'gender_id' => $user->profile->gender_id ? (string)$user->profile->gender_id : null,
                    'contact_number' => $user->profile->contact_number,
                    'street' => $user->profile->street,
                    'city' => $user->profile->city,
                    'province' => $user->profile->province,
                    'postal_code' => $user->profile->postal_code,
                    'country' => $user->profile->country,
                    'profile_img' => $user->profile->profile_img ? $user->profile->profile_img : null,
                ] : null,
                'worker' => null,
            ];
        }

        $skillsId = $this->parseArray($user->worker->skills_id);
        $credentialsName = $this->parseArray($user->worker->credentials_name);
        $credentialsPhoto = $this->parseArray($user->worker->credentials_photo);
        
        // Debug logging for credentials
        Log::info('formatWorker credentials debug', [
            'user_id' => $user->id,
            'raw_credentials_name' => $user->worker->credentials_name,
            'raw_credentials_photo' => $user->worker->credentials_photo,
            'parsed_credentials_name' => $credentialsName,
            'parsed_credentials_photo' => $credentialsPhoto,
        ]);

        // Ensure $skillsId is an array of arrays
        if (!is_array($skillsId)) {
            Log::warning('skills_id is not an array in formatWorker', [
                'user_id' => $user->id,
                'skills_id' => $skillsId,
                'type' => gettype($skillsId)
            ]);
            $skillsId = [];
        } else {
            foreach ($skillsId as $index => &$skill) {
                if (!is_array($skill)) {
                    Log::warning('Invalid skill entry in skills_id', [
                        'user_id' => $user->id,
                        'index' => $index,
                        'skill' => $skill,
                        'type' => gettype($skill)
                    ]);
                    $skill = ['skill_id' => null, 'skill_name' => '', 'sub_skills' => []];
                    continue;
                }
                $skillId = $skill['skill_id'] ?? null;
                if (!$skillId || !is_numeric($skillId)) {
                    Log::warning('Invalid or missing skill_id in skills_id', [
                        'user_id' => $user->id,
                        'index' => $index,
                        'skill' => $skill
                    ]);
                    $skill['sub_skills'] = [];
                    continue;
                }
                $dbSkill = Skill::find($skillId);
                if ($dbSkill) {
                    $availableSubSkills = $this->parseSubSkills($dbSkill->sub_skills);
                    $skill['sub_skills'] = array_filter($skill['sub_skills'] ?? [], function ($subSkill) use ($availableSubSkills) {
                        return in_array($subSkill, $availableSubSkills);
                    });
                } else {
                    Log::warning('Skill not found', ['skill_id' => $skillId, 'user_id' => $user->id]);
                    $skill['sub_skills'] = [];
                }
            }
            unset($skill); // Unset reference to avoid accidental modification
        }

        // Structure skills_id based on the data format
        $structuredSkillsId = [];
        if (is_array($skillsId) && count($skillsId) > 0) {
            // Check if it's already structured (has primary_skills and additional_skills keys)
            if (isset($skillsId['primary_skills']) && isset($skillsId['additional_skills'])) {
                // Ensure arrays are properly formatted (not objects with numeric keys)
                $primarySkills = is_array($skillsId['primary_skills']) ? array_values($skillsId['primary_skills']) : [];
                $additionalSkills = is_array($skillsId['additional_skills']) ? array_values($skillsId['additional_skills']) : [];
                
                // Remove any extra fields that might have been added incorrectly
                $primarySkills = array_filter($primarySkills, function($item) {
                    return is_array($item) && isset($item['skill_id']) && isset($item['skill_name']);
                });
                $additionalSkills = array_filter($additionalSkills, function($item) {
                    return is_array($item) && isset($item['skill_id']) && isset($item['skill_name']);
                });
                
                $structuredSkillsId = [
                    'primary_skills' => array_values($primarySkills),
                    'additional_skills' => array_values($additionalSkills),
                ];
            } else {
                // Convert flat array to structured format
                // First skill is primary, rest are additional
                $primarySkills = count($skillsId) > 0 ? [$skillsId[0]] : [];
                $additionalSkills = count($skillsId) > 1 ? array_slice($skillsId, 1) : [];
                
                $structuredSkillsId = [
                    'primary_skills' => array_values($primarySkills),
                    'additional_skills' => array_values($additionalSkills),
                ];
            }
        } else {
            $structuredSkillsId = [
                'primary_skills' => [],
                'additional_skills' => [],
            ];
        }

        // Calculate rank for the worker
        $workerRank = $this->calculateWorkerRank($user);

        return [
            'id' => $user->id,
            'email' => $user->email,
            'archived' => $user->archived,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'profile_id' => $user->profile ? $user->profile->id : null,
            'profile' => $user->profile ? [
                'id' => $user->profile->id,
                'first_name' => $user->profile->first_name,
                'middlename' => $user->profile->middlename,
                'last_name' => $user->profile->last_name,
                'suffix_id' => $user->profile->suffix_id ? (string)$user->profile->suffix_id : null,
                'gender_id' => $user->profile->gender_id ? (string)$user->profile->gender_id : null,
                'contact_number' => $user->profile->contact_number,
                'street' => $user->profile->street,
                'city' => $user->profile->city,
                'province' => $user->profile->province,
                'postal_code' => $user->profile->postal_code,
                'country' => $user->profile->country,
                'profile_img' => $user->profile->profile_img ? $user->profile->profile_img : null,
            ] : null,
            'worker' => [
                'work_type' => $user->worker->work_type,
                'hours_per_day' => $user->worker->hours_per_day,
                'preferred_working_hours' => $user->worker->preferred_working_hours,
                'preferred_working_days' => $user->worker->preferred_working_days,
                'bio' => $user->worker->bio,
                'skills_id' => $structuredSkillsId,
                'credentials_name' => $credentialsName,
                'credentials_photo' => $credentialsPhoto,
                'archived' => $user->worker->archived,
                'is_reviewed' => $user->worker->is_reviewed,
                'verified' => $user->worker->verified ?? false,
                'rank' => $workerRank ? [
                    'id' => $workerRank->id,
                    'name' => $workerRank->name,
                    'image' => $workerRank->image,
                    'min_points' => $workerRank->min_points,
                    'max_points' => $workerRank->max_points,
                ] : null,
            ],
        ];
    }

    /**
     * Complete a worker's profile.
     */
    public function completeProfile(Request $request): JsonResponse
    {
        try {
            Log::info('Complete profile request data', ['input' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'work_type' => 'required|in:part-time,full-time,one-time',
                'hours_per_day' => 'nullable|integer|min:1|max:24',
                'preferred_working_hours' => 'nullable|string',
                'bio' => 'nullable|string|max:1000',
                'preferred_working_days' => 'nullable|string',
                'skills_id' => 'required|array',
                'skills_id.primary_skills' => 'required|array|min:1',
                'skills_id.primary_skills.*.skill_id' => 'required|integer|exists:skills,id',
                'skills_id.primary_skills.*.skill_name' => 'required|string|max:255',
                'skills_id.primary_skills.*.sub_skills' => 'nullable|array',
                'skills_id.primary_skills.*.sub_skills.*' => 'string|max:255',
                'skills_id.additional_skills' => 'nullable|array',
                'skills_id.additional_skills.*.skill_id' => 'required_with:skills_id.additional_skills.*|integer|exists:skills,id',
                'skills_id.additional_skills.*.skill_name' => 'required_with:skills_id.additional_skills.*|string|max:255',
                'skills_id.additional_skills.*.sub_skills' => 'nullable|array',
                'skills_id.additional_skills.*.sub_skills.*' => 'string|max:255',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required|string|max:255',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:10240',
                'credentials.*.credentials_doc' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png,jpg|max:10240',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for complete profile', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $profileId = $request->profile_id;
            $user = User::whereHas('profile', function ($query) use ($profileId) {
                $query->where('id', $profileId);
            })->with(['profile', 'worker'])->firstOrFail();

            if (!$user->worker) {
                Worker::create([
                    'profile_id' => $profileId,
                    'work_type' => $request->work_type,
                    'skills_id' => [],
                    'credentials_name' => [],
                    'archived' => false,
                    'is_reviewed' => '0',
                ]);
                $user->load('worker');
            }

            $skillsId = $request->input('skills_id', []);
            if (is_string($skillsId)) {
                $decoded = json_decode($skillsId, true);
                $skillsId = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($skillsId)) {
                Log::warning('skills_id is not an array', ['skills_id' => $request->input('skills_id')]);
                return response()->json(['errors' => ['skills_id' => ['The skills id must be an array.']]], 400);
            }

            // Process primary and additional skills separately
            $primarySkills = $skillsId['primary_skills'] ?? [];
            $additionalSkills = $skillsId['additional_skills'] ?? [];
            $allSkills = array_merge($primarySkills, $additionalSkills);

            $skillIds = array_column($allSkills, 'skill_id');
            if (count(array_unique($skillIds)) !== count($skillIds)) {
                return response()->json(['errors' => ['skills_id' => ['Duplicate skill IDs are not allowed']]], 400);
            }

            foreach ($allSkills as $index => $skillData) {
                $skill = Skill::find($skillData['skill_id']);
                if ($skill && !empty($skillData['sub_skills'])) {
                    $availableSubSkills = $this->parseSubSkills($skill->sub_skills);
                    foreach ($skillData['sub_skills'] as $subSkill) {
                        if (!in_array($subSkill, $availableSubSkills)) {
                            return response()->json([
                                'errors' => ["skills_id.$index.sub_skills" => ["Invalid sub-skill: $subSkill"]],
                            ], 400);
                        }
                    }
                }
            }

            if (count($allSkills) > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $user->worker->id,
                    'total_skills' => count($allSkills),
                ]);
                return response()->json(['error' => 'Cannot have more than 15 skills'], 400);
            }

            // Parse preferred_working_days if it's a JSON string
            $preferredWorkingHours = $request->preferred_working_days;
            if (is_string($preferredWorkingHours)) {
                $preferredWorkingHours = json_decode($preferredWorkingHours, true);
            }
            // Ensure it's always an array
            if (!is_array($preferredWorkingHours)) {
                $preferredWorkingHours = [];
            }

            $credentials_name = [];
            $credentials_photo = [];
            $credentials_doc = [];
            
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        $credentials_name[] = $credential['credentials_name'];
                        
                        // Handle credentials_photo file upload
                        if ($request->hasFile("credentials.{$index}.credentials_photo")) {
                            $photoFile = $request->file("credentials.{$index}.credentials_photo");
                            $photoPath = $photoFile->store('credentials', 'public');
                            $credentials_photo[] = $photoPath;
                        } else {
                            $credentials_photo[] = null;
                        }
                        
                        // Handle credentials_doc file upload
                        if ($request->hasFile("credentials.{$index}.credentials_doc")) {
                            $docFile = $request->file("credentials.{$index}.credentials_doc");
                            $docPath = $docFile->store('credentials', 'public');
                            $credentials_doc[] = $docPath;
                        } else {
                            $credentials_doc[] = null;
                        }
                    }
                }
            }

            $user->worker->update([
                'work_type' => $request->work_type,
                'hours_per_day' => $request->hours_per_day,
                'preferred_working_hours' => $preferredWorkingHours,
                'preferred_working_days' => $preferredWorkingHours,
                'skills_id' => $skillsId, // Keep the original structure with primary_skills and additional_skills
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'credentials_doc' => $credentials_doc,
                'bio' => $request->bio,
                'is_reviewed' => 'TO BE REVIEWED',
            ]);

            Log::info('Worker profile completed', [
                'worker_id' => $user->worker->id,
                'profile_id' => $profileId,
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'credentials_doc' => $credentials_doc,
                'bio' => $request->bio,
                'is_reviewed' => 'TO BE REVIEWED',
            ]);

            return response()->json([
                'message' => 'Profile completed successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error completing profile: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to complete profile: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch workers filtered by skills and only ACCEPTED status.
     */
    public function getWorkersBySkills(Request $request): JsonResponse
    {
        try {
            $skillNames = $request->query('skill_names', []);
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);
            $excludeUserId = $request->query('exclude_user_id');

            // If skill_names is a string, convert to array
            if (is_string($skillNames)) {
                $skillNames = explode(',', $skillNames);
            }

            $query = User::with(['profile', 'worker'])
                ->whereIn('users.role_id', [1, 2]) // Allow both workers (1) and employers (2)
                ->where('users.archived', false)
                ->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'ACCEPTED');
                    // $q->where('verified', true);
                });

            // Exclude specific user if provided
            if ($excludeUserId) {
                $query->where('users.id', '!=', $excludeUserId);
            }

            // Filter by skills if provided
            if (!empty($skillNames)) {
                Log::info('Filtering workers by skills', ['skill_names' => $skillNames]);
                
                // First, let's try without skill filtering to see if we get any workers
                $testQuery = clone $query;
                $testWorkers = $testQuery->get();
                Log::info('Workers without skill filter', ['count' => $testWorkers->count()]);
                
                // Apply skill filtering using a comprehensive approach
                $query->whereHas('worker', function ($q) use ($skillNames) {
                    $q->where(function ($subQ) use ($skillNames) {
                        foreach ($skillNames as $skillName) {
                            // Search for skill name in the JSON structure with multiple patterns
                            $subQ->orWhere('skills_id', 'like', '%"skill_name":"' . $skillName . '"%')
                                 ->orWhere('skills_id', 'like', '%"skill_name": "' . $skillName . '"%')
                                 ->orWhere('skills_id', 'like', '%skill_name":"' . $skillName . '"%')
                                 ->orWhere('skills_id', 'like', '%skill_name": "' . $skillName . '"%')
                                 ->orWhere('skills_id', 'like', '%' . $skillName . '%');
                        }
                    });
                });
            }

            // Debug: Log the SQL query being executed
            Log::info('SQL Query for workers by skills', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);

            $workers = $query->orderBy('users.created_at', 'desc')
                           ->paginate($limit, ['*'], 'page', $page);

            $response = [
                'workers' => collect($workers->items())->map(function ($user) {
                    return $this->formatWorker($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $workers->currentPage(),
                    'totalPages' => $workers->lastPage(),
                    'totalItems' => $workers->total(),
                ],
            ];

            // Debug: Log some sample skills_id data
            $sampleWorkers = $workers->take(2);
            foreach ($sampleWorkers as $worker) {
                if ($worker->worker && $worker->worker->skills_id) {
                    Log::info('Sample worker skills_id', [
                        'worker_id' => $worker->id,
                        'skills_id' => $worker->worker->skills_id
                    ]);
                }
            }

            Log::info('Fetched workers by skills', [
                'skill_names' => $skillNames,
                'count' => $workers->count(),
                'page' => $page,
                'limit' => $limit,
            ]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching workers by skills: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch workers by skills: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update worker's work preferences.
     */
    public function updatePreferences(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Update work preferences request data', [
                'id' => $id, 
                'input' => $request->all()
            ]);

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            if (!$user->worker) {
                return response()->json(['error' => 'Worker record not found'], 404);
            }

            // Validate the request
            $request->validate([
                'work_type' => 'nullable|string|max:255',
                'hours_per_day' => 'nullable|integer|min:1|max:24',
                'preferred_working_hours' => 'nullable|string',
                'preferred_working_days' => 'nullable|string',
                'bio' => 'nullable|string|max:1000',
            ]);

            // Update worker preferences
            $updateData = [];
            
            if ($request->has('work_type')) {
                $updateData['work_type'] = $request->input('work_type');
            }
            
            if ($request->has('hours_per_day')) {
                $updateData['hours_per_day'] = $request->input('hours_per_day');
            }
            
            if ($request->has('preferred_working_days')) {
                $updateData['preferred_working_days'] = $request->input('preferred_working_days');
            }
            
            if ($request->has('bio')) {
                $updateData['bio'] = $request->input('bio');
            }

            $user->worker->update($updateData);

            Log::info('Worker preferences updated', [
                'worker_id' => $user->worker->id,
                'update_data' => $updateData,
            ]);

            return response()->json([
                'message' => 'Work preferences updated successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating work preferences: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            return response()->json(['error' => 'Unable to save your work preferences at this time.'], 500);
        }
    }

    /**
     * Update worker's credentials.
     */
    public function updateCredentials(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Update credentials request data', [
                'id' => $id, 
                'input' => $request->all(),
                'files' => $request->allFiles(),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method()
            ]);

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

            if (!$user->worker) {
                return response()->json(['error' => 'Worker record not found'], 404);
            }

            $credentialsNames = [];
            $credentialsPhotos = [];

            // Handle credentials data - check for both formats
            $credentialsData = [];
            
            // Check if credentials are sent as individual form fields (from frontend)
            $credentialIndex = 0;
            while ($request->has("credentials[{$credentialIndex}][credentials_name]")) {
                $credentialName = $request->input("credentials[{$credentialIndex}][credentials_name]");
                $credentialPhoto = $request->file("credentials[{$credentialIndex}][credentials_photo]");
                $existingPhoto = $request->input("credentials[{$credentialIndex}][existing_photo]");
                
                $credentialsData[] = [
                    'credentials_name' => $credentialName,
                    'credentials_photo' => $credentialPhoto,
                    'existing_photo' => $existingPhoto
                ];
                $credentialIndex++;
            }
            
            // If no individual fields found, check for JSON credentials field
            if (empty($credentialsData) && $request->has('credentials')) {
                $credentialsData = $request->input('credentials');
                
                // If credentials is a JSON string, decode it
                if (is_string($credentialsData)) {
                    $credentialsData = json_decode($credentialsData, true);
                }
                
                // Ensure it's an array
                if (!is_array($credentialsData)) {
                    $credentialsData = [];
                }
                
                // Extract files from the request and attach them to credentials
                $requestFiles = $request->allFiles();
                if (isset($requestFiles['credentials']) && is_array($requestFiles['credentials'])) {
                    foreach ($requestFiles['credentials'] as $index => $fileGroup) {
                        if (isset($fileGroup['credentials_photo']) && isset($credentialsData[$index])) {
                            $credentialsData[$index]['credentials_photo'] = $fileGroup['credentials_photo'];
                        }
                    }
                }
            }
            
            // Debug: Log the credentials data structure
            Log::info('Credentials data structure', [
                'credentials_data' => $credentialsData,
                'request_all' => $request->all(),
                'request_files' => $request->allFiles(),
            ]);
            
            // Process credentials data
            foreach ($credentialsData as $index => $credential) {
                if (isset($credential['credentials_name'])) {
                    $credentialsNames[] = $credential['credentials_name'];
                    
                    // Handle file upload - check multiple possible formats
                    $fileProcessed = false;
                    
                    // Check if it's an UploadedFile object
                    if (isset($credential['credentials_photo']) && $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile) {
                        $file = $credential['credentials_photo'];
                        $filename = time() . '_' . $index . '_' . $file->getClientOriginalName();
                        $path = $file->storeAs('credentials', $filename, 'public');
                        $credentialsPhotos[] = $path;
                        $fileProcessed = true;
                        Log::info('File uploaded successfully', ['path' => $path, 'filename' => $filename]);
                    }
                    
                    // Check if it's an existing photo path
                    if (!$fileProcessed && isset($credential['existing_photo']) && !empty($credential['existing_photo'])) {
                        $credentialsPhotos[] = $credential['existing_photo'];
                        $fileProcessed = true;
                        Log::info('Using existing photo', ['path' => $credential['existing_photo']]);
                    }
                    
                    // If no file was processed, set to null
                    if (!$fileProcessed) {
                        $credentialsPhotos[] = null;
                        Log::warning('No file processed for credential', ['index' => $index, 'credential' => $credential]);
                    }
                }
            }

            // Update worker credentials
            $user->worker->update([
                'credentials_name' => $credentialsNames,
                'credentials_photo' => $credentialsPhotos,
            ]);

            Log::info('Worker credentials updated', [
                'worker_id' => $user->worker->id,
                'credentials_count' => count($credentialsNames),
                'credentials_names' => $credentialsNames,
                'credentials_photos' => $credentialsPhotos,
                'raw_credentials_data' => $credentialsData,
            ]);

            return response()->json([
                'message' => 'Credentials updated successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating credentials: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            // Provide user-friendly error messages
            $errorMessage = 'Unable to save your credentials at this time.';
            if (strpos($e->getMessage(), 'foreach') !== false) {
                $errorMessage = 'Please add at least one credential before saving.';
            } elseif (strpos($e->getMessage(), 'file') !== false) {
                $errorMessage = 'There was an issue with the uploaded file. Please try again.';
            } elseif (strpos($e->getMessage(), 'validation') !== false) {
                $errorMessage = 'Please check your credential information and try again.';
            }
            
            return response()->json(['error' => $errorMessage], 500);
        }
    }
}
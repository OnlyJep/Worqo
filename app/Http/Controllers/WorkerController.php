<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\Profile;
use App\Models\User;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class WorkerController extends Controller
{
    /**
     * Fetch all available workers.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);

            $query = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->where('archived', false);

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', 'like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

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
                }
                if (!$user->worker && $user->profile) {
                    Worker::updateOrCreate(
                        ['profile_id' => $user->profile->id],
                        [
                            'work_type' => 'part-time',
                            'skills_id' => ['primary' => null, 'additional' => []],
                            'credentials_name' => null,
                            'credentials_photo' => null,
                            'archived' => false,
                        ]
                    );
                }
            }

            $workers = $query->paginate($limit, ['*'], 'page', $page);

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
     * Fetch archived workers.
     */
    public function archived(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);

            $query = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->where('archived', true);

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', 'like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

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
                }
                if (!$user->worker && $user->profile) {
                    Worker::updateOrCreate(
                        ['profile_id' => $user->profile->id],
                        [
                            'work_type' => 'part-time',
                            'skills_id' => ['primary' => null, 'additional' => []],
                            'credentials_name' => null,
                            'credentials_photo' => null,
                            'archived' => true,
                        ]
                    );
                }
            }

            $workers = $query->paginate($limit, ['*'], 'page', $page);

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
            $user = Auth::guard('api')->user();
            if (!$user || $user->id != $id) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $user = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->findOrFail($id);

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
            }
            if (!$user->worker && $user->profile) {
                Worker::updateOrCreate(
                    ['profile_id' => $user->profile->id],
                    [
                        'work_type' => 'part-time',
                        'skills_id' => ['primary' => null, 'additional' => []],
                        'credentials_name' => null,
                        'credentials_photo' => null,
                        'archived' => $user->archived,
                    ]
                );
                $user = User::with(['profile', 'worker'])
                    ->where('role_id', 1)
                    ->findOrFail($id);
            }

            Log::info('Fetched worker with role_id = 1', ['id' => $id]);
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
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix_id' => 'nullable|integer|exists:suffixes,id',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'gender_id' => 'required|integer|exists:genders,id',
                'contact_number' => 'nullable|string|max:20|regex:/^\+?[\d\s-]{7,20}$/',
                'street' => 'nullable|string|max:255',
                'work_type' => 'required|in:part-time,full-time,one-time-job',
                'skills_id' => 'nullable|array',
                'skills_id.primary' => 'nullable|array',
                'skills_id.primary.skill_id' => 'required_with:skills_id.primary|integer|exists:skills,id',
                'skills_id.primary.sub_skills' => 'nullable|array',
                'skills_id.primary.sub_skills.*' => 'string',
                'skills_id.additional' => 'nullable|array',
                'skills_id.additional.*.skill_id' => 'required_with:skills_id.additional|integer|exists:skills,id',
                'skills_id.additional.*.sub_skills' => 'nullable|array',
                'skills_id.additional.*.sub_skills.*' => 'string',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for worker creation', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
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

            $credentials_name = [];
            $credentials_photo = [];
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name']) && isset($credential['credentials_photo']) && $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile) {
                        $file = $credential['credentials_photo'];
                        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                        $path = $file->storeAs('credentialsphoto', $filename, 'public');
                        $credentials_name[] = $credential['credentials_name'];
                        $credentials_photo[] = $path;
                    }
                }
            }

            $worker = Worker::create([
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'skills_id' => $request->skills_id ?? ['primary' => null, 'additional' => []],
                'credentials_name' => !empty($credentials_name) ? $credentials_name : null,
                'credentials_photo' => !empty($credentials_photo) ? $credentials_photo : null,
                'archived' => false,
            ]);

            // Generate Passport token for the new user
            $token = $user->createToken('authToken')->accessToken;

            Log::info('Worker created', [
                'worker_id' => $worker->id,
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'skills_id' => $worker->skills_id,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
            ]);

            return response()->json([
                'message' => 'Worker created successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
                'token' => $token, // Return Passport token
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
            $user = Auth::guard('api')->user();
            if (!$user || $user->id != $id) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

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
            }

            if (!$user->worker) {
                Worker::updateOrCreate(
                    ['profile_id' => $user->profile->id],
                    [
                        'work_type' => $request->work_type ?? 'part-time',
                        'skills_id' => ['primary' => null, 'additional' => []],
                        'credentials_name' => null,
                        'credentials_photo' => null,
                        'archived' => $user->archived,
                    ]
                );
                $user = User::with(['profile', 'worker'])
                    ->where('role_id', 1)
                    ->findOrFail($id);
            }

            $validator = Validator::make($request->all(), [
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
                'skills_id' => 'nullable|array',
                'skills_id.primary' => 'nullable|array',
                'skills_id.primary.skill_id' => 'required_with:skills_id.primary|integer|exists:skills,id',
                'skills_id.primary.sub_skills' => 'nullable|array',
                'skills_id.primary.sub_skills.*' => 'string',
                'skills_id.additional' => 'nullable|array',
                'skills_id.additional.*.skill_id' => 'required_with:skills_id.additional|integer|exists:skills,id',
                'skills_id.additional.*.sub_skills' => 'nullable|array',
                'skills_id.additional.*.sub_skills.*' => 'string',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for worker update', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
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
            }

            $user->profile->update($profileData);

            $credentials_name = [];
            $credentials_photo = [];
            $existing_credentials_name = $user->worker->credentials_name ?? [];
            $existing_credentials_photo = $user->worker->credentials_photo ?? [];

            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        $credentials_name[] = $credential['credentials_name'];
                        if (isset($credential['credentials_photo']) && $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile) {
                            $file = $credential['credentials_photo'];
                            $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                            $path = $file->storeAs('credentialsphoto', $filename, 'public');
                            $credentials_photo[] = $path;
                        } else if (isset($existing_credentials_photo[$index]) && !empty($existing_credentials_photo[$index])) {
                            $credentials_photo[] = $existing_credentials_photo[$index];
                        } else {
                            $credentials_photo[] = null;
                        }
                    }
                }

                foreach ($existing_credentials_photo as $index => $oldPhoto) {
                    if ($oldPhoto && !in_array($oldPhoto, $credentials_photo) && Storage::disk('public')->exists($oldPhoto)) {
                        Storage::disk('public')->delete($oldPhoto);
                    }
                }
            }

            $user->worker->update([
                'work_type' => $request->work_type,
                'skills_id' => $request->skills_id ?? $user->worker->skills_id,
                'credentials_name' => !empty($credentials_name) ? $credentials_name : null,
                'credentials_photo' => !empty($credentials_photo) ? $credentials_photo : null,
                'archived' => $user->archived,
            ]);

            Log::info('Worker updated', [
                'worker_id' => $user->worker->id,
                'work_type' => $request->work_type,
                'skills_id' => $request->skills_id,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
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
     * Update worker's archive status.
     */
    public function updateArchiveStatus(Request $request, $id): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user || $user->id != $id) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

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
            $user = Auth::guard('api')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

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
                ->where('archived', !$archived)
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
            // Validate request data
            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'skill_id' => 'required|integer|exists:skills,id',
                'sub_skills' => 'nullable|array',
                'sub_skills.*' => 'string',
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
            $requestedSubSkills = $request->sub_skills ?? [];

            // Fetch profile
            $profile = Profile::findOrFail($profileId);

            // Fetch skill and its sub_skills
            $skill = Skill::findOrFail($skillId);
            $availableSubSkills = [];

            // Safely decode sub_skills from skills table
            if ($skill->sub_skills) {
                try {
                    $decodedSubSkills = json_decode($skill->sub_skills, true);
                    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedSubSkills)) {
                        Log::error('Invalid JSON in skill sub_skills', [
                            'skill_id' => $skill->id,
                            'sub_skills' => $skill->sub_skills,
                            'json_error' => json_last_error_msg(),
                        ]);
                        return response()->json(['error' => 'Invalid sub-skills data for skill'], 500);
                    }
                    $availableSubSkills = $decodedSubSkills;
                } catch (\Exception $e) {
                    Log::error('Error decoding sub_skills JSON', [
                        'skill_id' => $skill->id,
                        'sub_skills' => $skill->sub_skills,
                        'error' => $e->getMessage(),
                    ]);
                    return response()->json(['error' => 'Failed to process sub-skills data'], 500);
                }
            }

            // Validate requested sub_skills
            if (!empty($requestedSubSkills)) {
                foreach ($requestedSubSkills as $subSkill) {
                    if (!in_array($subSkill, $availableSubSkills)) {
                        Log::warning('Invalid sub-skill provided', [
                            'skill_id' => $skillId,
                            'sub_skill' => $subSkill,
                            'available_sub_skills' => $availableSubSkills,
                        ]);
                        return response()->json(['error' => "Sub-skill '$subSkill' is not valid for skill ID $skillId"], 400);
                    }
                }
            }

            // Fetch or create worker
            $worker = Worker::firstOrCreate(
                ['profile_id' => $profileId],
                [
                    'work_type' => 'part-time',
                    'skills_id' => ['primary' => null, 'additional' => []],
                    'credentials_name' => null,
                    'credentials_photo' => null,
                    'archived' => false,
                ]
            );

            // Ensure skills_id is a valid array
            $skillsId = is_array($worker->skills_id) ? $worker->skills_id : ['primary' => null, 'additional' => []];
            if (!isset($skillsId['primary'])) {
                $skillsId['primary'] = null;
            }
            if (!isset($skillsId['additional']) || !is_array($skillsId['additional'])) {
                $skillsId['additional'] = [];
            }

            // Check if skill already exists
            $skillExists = ($skillsId['primary'] && isset($skillsId['primary']['skill_id']) && $skillsId['primary']['skill_id'] == $skillId) ||
                           collect($skillsId['additional'])->contains('skill_id', $skillId);

            if ($skillExists) {
                Log::info('Skill already exists for worker', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'skill_id' => $skillId,
                ]);
                return response()->json(['message' => 'Skill already added'], 200);
            }

            // Prepare new skill with validated sub_skills
            $newSkill = [
                'skill_id' => $skillId,
                'sub_skills' => $requestedSubSkills,
            ];

            // Add skill to primary or additional
            if (!$skillsId['primary']) {
                $skillsId['primary'] = $newSkill;
            } else {
                $skillsId['additional'][] = $newSkill;
            }

            // Check skill limit
            $totalSkills = ($skillsId['primary'] ? 1 : 0) + count($skillsId['additional']);
            if ($totalSkills > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'total_skills' => $totalSkills,
                ]);
                return response()->json(['error' => 'Cannot add more than 15 skills'], 400);
            }

            // Validate skills_id JSON serialization
            try {
                $jsonSkillsId = json_encode($skillsId);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to serialize skills_id', [
                        'worker_id' => $worker->id,
                        'profile_id' => $profileId,
                        'skills_id' => $skillsId,
                        'json_error' => json_last_error_msg(),
                    ]);
                    return response()->json(['error' => 'Failed to serialize skills data'], 500);
                }
            } catch (\Exception $e) {
                Log::error('Error serializing skills_id', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'skills_id' => $skillsId,
                    'error' => $e->getMessage(),
                ]);
                return response()->json(['error' => 'Failed to process skills data'], 500);
            }

            // Save worker with updated skills_id
            $worker->skills_id = $skillsId;
            try {
                if (!$worker->save()) {
                    Log::error('Failed to save worker skills', [
                        'worker_id' => $worker->id,
                        'profile_id' => $profileId,
                        'skills_id' => $skillsId,
                    ]);
                    return response()->json(['error' => 'Failed to save skill to database'], 500);
                }
            } catch (\Exception $e) {
                Log::error('Database error saving worker skills', [
                    'worker_id' => $worker->id,
                    'profile_id' => $profileId,
                    'skills_id' => $skillsId,
                    'error' => $e->getMessage(),
                ]);
                return response()->json(['error' => 'Database error: Failed to save skill'], 500);
            }

            Log::info('Skill added to worker', [
                'worker_id' => $worker->id,
                'profile_id' => $profileId,
                'skill_id' => $skillId,
                'sub_skills' => $requestedSubSkills,
                'skills_id' => $skillsId,
            ]);

            return response()->json([
                'message' => 'Skill added successfully',
                'worker' => $this->formatWorker($worker),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Model not found in addSkill', [
                'message' => $e->getMessage(),
                'profile_id' => $request->profile_id,
                'skill_id' => $request->skill_id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Profile or skill not found'], 404);
        } catch (\Exception $e) {
            Log::error('Unexpected error in addSkill', [
                'message' => $e->getMessage(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to save skill: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Complete the worker's profile by updating skills_id and work_type.
     */
    public function completeProfile(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized: Invalid or missing token'], 401);
            }

            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'work_type' => 'required|in:part-time,full-time,one-time-job',
                'skills_id' => 'required|array',
                'skills_id.primary' => 'required|array',
                'skills_id.primary.skill_id' => 'required|integer|exists:skills,id',
                'skills_id.primary.sub_skills' => 'nullable|array',
                'skills_id.primary.sub_skills.*' => 'string',
                'skills_id.additional' => 'required|array|min:1',
                'skills_id.additional.*.skill_id' => 'required|integer|exists:skills,id',
                'skills_id.additional.*.sub_skills' => 'nullable|array',
                'skills_id.additional.*.sub_skills.*' => 'string',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for completing profile', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $profileId = $request->profile_id;
            $profile = Profile::findOrFail($profileId);

            if ($profile->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized: Profile does not belong to this user'], 403);
            }

            $worker = Worker::where('profile_id', $profileId)->first();
            if (!$worker) {
                $worker = Worker::create([
                    'profile_id' => $profileId,
                    'work_type' => $request->work_type,
                    'skills_id' => ['primary' => null, 'additional' => []],
                    'credentials_name' => null,
                    'credentials_photo' => null,
                    'archived' => false,
                ]);
            }

            $allSkillIds = [$request->skills_id['primary']['skill_id']];
            foreach ($request->skills_id['additional'] as $additional) {
                $allSkillIds[] = $additional['skill_id'];
            }

            if (count(array_unique($allSkillIds)) !== count($allSkillIds)) {
                return response()->json(['error' => 'Duplicate skill IDs are not allowed'], 400);
            }

            $skillRecord = Skill::findOrFail($request->skills_id['primary']['skill_id']);
            $availableSubSkills = $skillRecord->sub_skills ? json_decode($skillRecord->sub_skills, true) : [];
            foreach ($request->skills_id['primary']['sub_skills'] ?? [] as $subSkill) {
                if (!in_array($subSkill, $availableSubSkills)) {
                    return response()->json(['error' => "Sub-skill '$subSkill' is not valid for skill ID {$request->skills_id['primary']['skill_id']}"], 400);
                }
            }

            foreach ($request->skills_id['additional'] as $skill) {
                $skillRecord = Skill::findOrFail($skill['skill_id']);
                $availableSubSkills = $skillRecord->sub_skills ? json_decode($skillRecord->sub_skills, true) : [];
                foreach ($skill['sub_skills'] ?? [] as $subSkill) {
                    if (!in_array($subSkill, $availableSubSkills)) {
                        return response()->json(['error' => "Sub-skill '$subSkill' is not valid for skill ID {$skill['skill_id']}"], 400);
                    }
                }
            }

            if (count($request->skills_id['additional']) + 1 > 15) {
                return response()->json(['error' => 'Cannot add more than 15 skills'], 400);
            }

            $credentials_name = [];
            $credentials_photo = [];
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name']) && isset($credential['credentials_photo']) && $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile) {
                        $file = $credential['credentials_photo'];
                        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                        $path = $file->storeAs('credentialsphoto', $filename, 'public');
                        $credentials_name[] = $credential['credentials_name'];
                        $credentials_photo[] = $path;
                    }
                }
            }

            $worker->update([
                'work_type' => $request->work_type,
                'skills_id' => $request->skills_id,
                'credentials_name' => !empty($credentials_name) ? $credentials_name : null,
                'credentials_photo' => !empty($credentials_photo) ? $credentials_photo : null,
            ]);

            $profile->update(['is_complete' => true]);

            Log::info('Worker profile completed', [
                'worker_id' => $worker->id,
                'profile_id' => $profileId,
                'work_type' => $request->work_type,
                'skills_id' => $request->skills_id,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
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
     * Fetch all available skills.
     */
    public function getSkills(Request $request): JsonResponse
    {
        try {
            $skills = Skill::all()->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name, // Updated to skill_name
                    'sub_skills' => $skill->sub_skills ? json_decode($skill->sub_skills, true) : [],
                    'created_at' => $skill->created_at,
                    'updated_at' => $skill->updated_at,
                ];
            });

            Log::info('Fetched all skills', ['count' => $skills->count()]);
            return response()->json($skills, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching skills: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch skills: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Format worker data for response.
     */
protected function formatWorker($worker)
    {
        $profile = $worker->profile;
        return [
            'id' => $worker->id,
            'profile_id' => $worker->profile_id,
            'work_type' => $worker->work_type,
            'skills_id' => $worker->skills_id ?? ['primary' => null, 'additional' => []],
            'credentials_name' => $worker->credentials_name ?? null,
            'credentials_photo' => $worker->credentials_photo ? collect($worker->credentials_photo)->map(function ($path) {
                return $path ? asset('storage/' . $path) : null;
            })->toArray() : null,
            'archived' => $worker->archived,
            'profile' => $profile ? [
                'id' => $profile->id,
                'user_id' => $profile->user_id,
                'first_name' => $profile->first_name,
                'middlename' => $profile->middlename,
                'last_name' => $profile->last_name,
                'suffix_id' => $profile->suffix_id,
                'gender_id' => $profile->gender_id,
                'contact_number' => $profile->contact_number,
                'street' => $profile->street,
                'city' => $profile->city,
                'province' => $profile->province,
                'postal_code' => $profile->postal_code,
                'country' => $profile->country,
                'profile_img' => $profile->profile_img ? asset('storage/' . $profile->profile_img) : null,
                'is_complete' => $profile->is_complete ?? false,
            ] : null,
        ];
    }

    // ... (other methods like index, archived, show, store, update, updateSkills, updateArchiveStatus, bulkArchive, completeProfile remain unchanged)
}
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
            $page = max(1, (int)$request->query('page', 1));
            // Enforce 5 items per page consistently
            $limit = 5;

            $query = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->where('archived', false);

            // Optional status filter: to_review | accepted | declined | all
            $status = $request->query('status', 'all');
            if ($status === 'to_review') {
                $query->whereHas('worker', function ($q) {
                    $q->whereNull('is_reviewed');
                });
            } elseif ($status === 'accepted') {
                $query->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'ACCEPTED');
                });
            } elseif ($status === 'declined') {
                $query->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'DECLINED');
                });
            }

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
                    $user->load('profile');
                }
                if (!$user->worker && $user->profile) {
                    Worker::create([
                        'profile_id' => $user->profile->id,
                        'work_type' => 'part-time',
                        'skills_id' => [],
                        'credentials_name' => [],
                        'credentials_photo' => [],
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
     * Fetch archived workers.
     */
    public function archived(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = max(1, (int)$request->query('page', 1));
            // Enforce 5 items per page consistently
            $limit = 5;

            $query = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->where('archived', true);

            // Optional status filter for archived list as well
            $status = $request->query('status', 'all');
            if ($status === 'to_review') {
                $query->whereHas('worker', function ($q) {
                    $q->whereNull('is_reviewed');
                });
            } elseif ($status === 'accepted') {
                $query->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'ACCEPTED');
                });
            } elseif ($status === 'declined') {
                $query->whereHas('worker', function ($q) {
                    $q->where('is_reviewed', 'DECLINED');
                });
            }

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
                    $user->load('profile');
                }
                if (!$user->worker && $user->profile) {
                    Worker::create([
                        'profile_id' => $user->profile->id,
                        'work_type' => 'part-time',
                        'skills_id' => [],
                        'credentials_name' => [],
                        'credentials_photo' => [],
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
                $user->load('profile');
            }
            if (!$user->worker && $user->profile) {
                Worker::create([
                    'profile_id' => $user->profile->id,
                    'work_type' => 'part-time',
                    'skills_id' => [],
                    'credentials_name' => [],
                    'credentials_photo' => [],
                    'archived' => $user->archived,
                ]);
                $user->load('worker');
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

            $validator = Validator::make(
                array_merge($request->all(), ['skills_id' => $skillsId]),
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
                    'work_type' => 'required|in:part-time,full-time,one-time-job',
                    'skills_id' => 'required|array|min:1',
                    'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                    'skills_id.*.skill_name' => 'required|string|max:255',
                    'skills_id.*.sub_skills' => 'nullable|array',
                    'skills_id.*.sub_skills.*' => 'string|max:255',
                    'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                    'credentials' => 'nullable|array',
                    'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                    'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
                    'experience' => 'nullable|in:0 to 11 months,2 to 5 years,5 to 10 years',
                    'is_reviewed' => 'nullable|in:ACCEPTED,DECLINED',
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

            $credentials_name = [];
            $credentials_photo = [];
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $credential) {
                    if (
                        isset($credential['credentials_name']) &&
                        !empty($credential['credentials_name']) &&
                        isset($credential['credentials_photo']) &&
                        $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile
                    ) {
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
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'archived' => false,
                'is_reviewed' => $request->has('is_reviewed') && $request->input('is_reviewed') !== '' ? $request->input('is_reviewed') : null,
                'experience' => $request->has('experience') && $request->input('experience') !== '' ? $request->input('experience') : null,
            ]);

            Log::info('Worker created', [
                'worker_id' => $worker->id,
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
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
                    'credentials_photo' => [],
                    'archived' => $user->archived,
                    'is_reviewed' => null,
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

            $validator = Validator::make(
                array_merge($request->all(), ['skills_id' => $skillsId]),
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
                    'skills_id' => 'required|array|min:1',
                    'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                    'skills_id.*.skill_name' => 'required|string|max:255',
                    'skills_id.*.sub_skills' => 'nullable|array',
                    'skills_id.*.sub_skills.*' => 'string|max:255',
                    'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                    'credentials' => 'nullable|array',
                    'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                    'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
                    'experience' => 'nullable|in:0 to 11 months,2 to 5 years,5 to 10 years',
                    'is_reviewed' => 'nullable|in:ACCEPTED,DECLINED',
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
            $credentials_photo = [];
            $existing_credentials_name = $this->parseArray($user->worker->credentials_name);
            $existing_credentials_photo = $this->parseArray($user->worker->credentials_photo);

            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        $credentials_name[] = $credential['credentials_name'];
                        if (
                            isset($credential['credentials_photo']) &&
                            $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile
                        ) {
                            $file = $credential['credentials_photo'];
                            $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                            $path = $file->storeAs('credentialsphoto', $filename, 'public');
                            $credentials_photo[] = $path;
                        } elseif (isset($existing_credentials_photo[$index]) && !empty($existing_credentials_photo[$index])) {
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
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
                'archived' => $user->archived,
                'experience' => $request->has('experience') ? ($request->input('experience') === '' ? null : $request->input('experience')) : $user->worker->experience,
                'is_reviewed' => $request->has('is_reviewed') ? ($request->input('is_reviewed') === '' ? null : $request->input('is_reviewed')) : $user->worker->is_reviewed,
            ]);

            Log::info('Worker updated', [
                'worker_id' => $user->worker->id,
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
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

            $validator = Validator::make(
                ['skills_id' => $skillsId],
                [
                    'skills_id' => 'required|array|min:1',
                    'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                    'skills_id.*.skill_name' => 'required|string|max:255',
                    'skills_id.*.sub_skills' => 'nullable|array',
                    'skills_id.*.sub_skills.*' => 'string|max:255',
                ]
            );

            if ($validator->fails()) {
                Log::warning('Validation failed for skills update', ['errors' => $validator->errors()->toArray()]);
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

            if (count($skillsId) > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $user->worker->id,
                    'total_skills' => count($skillsId),
                ]);
                return response()->json(['error' => 'Cannot have more than 15 skills'], 400);
            }

            $user->worker->update([
                'skills_id' => $skillsId,
            ]);

            Log::info('Worker skills updated', [
                'worker_id' => $user->worker->id,
                'skills_id' => $skillsId,
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
            Log::info('Add skill request data', ['input' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'profile_id' => 'required|integer|exists:profiles,id',
                'skill_id' => 'required|integer|exists:skills,id',
                'skill_name' => 'required|string|max:255',
                'sub_skills' => 'nullable|array',
                'sub_skills.*' => 'string|max:255',
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
                    'credentials_photo' => [],
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
     * Bulk update workers' review status.
     */
    public function bulkReview(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array|min:1',
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
                ->with('worker')
                ->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No valid workers found for review update'], 400);
            }

            $updated = 0;
            foreach ($users as $user) {
                if (!$user->worker) {
                    continue;
                }
                if ($user->worker->is_reviewed !== $status) {
                    $user->worker->update(['is_reviewed' => $status]);
                    $updated++;
                }
            }

            Log::info('Workers bulk review updated', ['ids' => $ids, 'status' => $status, 'updated' => $updated]);
            return response()->json(['message' => 'Workers review status updated', 'updated' => $updated], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk updating worker review status: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update workers review status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete declined workers (and their related data/files).
     */
    public function bulkDeleteDeclined(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array|min:1',
                'worker_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk delete declined', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);

            $users = User::whereIn('id', $ids)
                ->where('role_id', 1)
                ->with(['profile', 'worker'])
                ->get();

            $deletedCount = 0;
            foreach ($users as $user) {
                if (!$user->worker || $user->worker->is_reviewed !== 'DECLINED') {
                    continue;
                }

                // Delete profile image file if exists
                if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }

                // Delete credentials files if exist
                if ($user->worker) {
                    $credentialPhotos = $this->parseArray($user->worker->credentials_photo);
                    foreach ($credentialPhotos as $photoPath) {
                        if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                            Storage::disk('public')->delete($photoPath);
                        }
                    }
                }

                // Delete related records then the user
                if ($user->worker) {
                    $user->worker->delete();
                }
                if ($user->profile) {
                    $user->profile->delete();
                }
                $user->delete();
                $deletedCount++;
            }

            if ($deletedCount === 0) {
                return response()->json(['error' => 'No declined workers found to delete'], 400);
            }

            Log::info('Declined workers bulk deleted', ['ids' => $ids, 'deleted' => $deletedCount]);
            return response()->json(['message' => 'Declined workers deleted', 'deleted' => $deletedCount], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting declined workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete declined workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a worker (user) only if archived.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = User::with(['profile', 'worker'])->where('role_id', 1)->findOrFail($id);

            if (!$user->archived) {
                return response()->json(['error' => 'Cannot delete an active worker. Archive first.'], 400);
            }

            // Delete files
            if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                Storage::disk('public')->delete($user->profile->profile_img);
            }
            if ($user->worker) {
                $credentialPhotos = $this->parseArray($user->worker->credentials_photo);
                foreach ($credentialPhotos as $photoPath) {
                    if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                        Storage::disk('public')->delete($photoPath);
                    }
                }
            }

            if ($user->worker) {
                $user->worker->delete();
            }
            if ($user->profile) {
                $user->profile->delete();
            }
            $user->delete();

            Log::info('Archived worker deleted', ['user_id' => $id]);
            return response()->json(['message' => 'Worker deleted'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete worker: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete archived workers.
     */
    public function bulkDeleteArchived(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array|min:1',
                'worker_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()->toArray()], 400);
            }

            $ids = $request->input('worker_ids', []);
            $users = User::whereIn('id', $ids)->where('role_id', 1)->where('archived', true)->with(['profile', 'worker'])->get();

            if ($users->isEmpty()) {
                return response()->json(['error' => 'No archived workers found to delete'], 400);
            }

            $deleted = 0;
            foreach ($users as $user) {
                if ($user->profile && $user->profile->profile_img && Storage::disk('public')->exists($user->profile->profile_img)) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }
                if ($user->worker) {
                    $credentialPhotos = $this->parseArray($user->worker->credentials_photo);
                    foreach ($credentialPhotos as $photoPath) {
                        if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                            Storage::disk('public')->delete($photoPath);
                        }
                    }
                    $user->worker->delete();
                }
                if ($user->profile) {
                    $user->profile->delete();
                }
                $user->delete();
                $deleted++;
            }

            return response()->json(['message' => 'Archived workers deleted', 'deleted' => $deleted], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting archived workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to delete archived workers: ' . $e->getMessage()], 500);
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

        // Normalize review status and extract experience (read directly from DB to avoid stale relations)
        $rawReview = Worker::where('profile_id', optional($user->profile)->id)->value('is_reviewed');
        $rawReviewNormalized = is_null($rawReview) ? null : strtoupper(trim((string)$rawReview));
        $normalizedReview = ($rawReviewNormalized === 'ACCEPTED' || $rawReviewNormalized === 'DECLINED')
            ? $rawReviewNormalized
            : null;
        $experience = Worker::where('profile_id', optional($user->profile)->id)->value('experience');

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

        return [
            'id' => $user->id,
            'email' => $user->email,
            'archived' => $user->archived,
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
            'worker' => [
                'work_type' => $user->worker->work_type,
                'skills_id' => $skillsId,
                'credentials_name' => $credentialsName,
                'credentials_photo' => $credentialsPhoto,
                'archived' => $user->worker->archived,
                'is_reviewed' => $normalizedReview,
                'experience' => $user->worker->experience,
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
                'work_type' => 'required|in:part-time,full-time,one-time-job',
                'skills_id' => 'required|array|min:1',
                'skills_id.*.skill_id' => 'required|integer|exists:skills,id',
                'skills_id.*.skill_name' => 'required|string|max:255',
                'skills_id.*.sub_skills' => 'nullable|array',
                'skills_id.*.sub_skills.*' => 'string|max:255',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
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
                    'credentials_photo' => [],
                    'archived' => false,
                    'is_reviewed' => null,
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

            if (count($skillsId) > 15) {
                Log::warning('Skill limit exceeded', [
                    'worker_id' => $user->worker->id,
                    'total_skills' => count($skillsId),
                ]);
                return response()->json(['error' => 'Cannot have more than 15 skills'], 400);
            }

            $credentials_name = [];
            $credentials_photo = [];
            if ($request->has('credentials') && is_array($request->credentials)) {
                foreach ($request->credentials as $index => $credential) {
                    if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                        $credentials_name[] = $credential['credentials_name'];
                        if (
                            isset($credential['credentials_photo']) &&
                            $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile
                        ) {
                            $file = $credential['credentials_photo'];
                            $filename = uniqid() . '.' . $file->getClientOriginalExtension();
                            $path = $file->storeAs('credentialsphoto', $filename, 'public');
                            $credentials_photo[] = $path;
                        } else {
                            $credentials_photo[] = null;
                        }
                    }
                }
            }

            $user->worker->update([
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo,
            ]);

            Log::info('Worker profile completed', [
                'worker_id' => $user->worker->id,
                'profile_id' => $profileId,
                'work_type' => $request->work_type,
                'skills_id' => $skillsId,
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
}
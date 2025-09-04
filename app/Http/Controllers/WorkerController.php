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
                            'skills_id' => null,
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
                            'skills_id' => null,
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

    public function show($id): JsonResponse
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
            }
            if (!$user->worker && $user->profile) {
                Worker::updateOrCreate(
                    ['profile_id' => $user->profile->id],
                    [
                        'work_type' => 'part-time',
                        'skills_id' => null,
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
                'work_type' => 'required|in:part-time,full-time,one-time',
                'skills_id' => 'nullable|array',
                'skills_id.*' => 'integer|exists:skills,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'credentials' => 'nullable|array',
                'credentials.*.credentials_name' => 'required_with:credentials.*.credentials_photo|string|max:255',
                'credentials.*.credentials_photo' => 'required_with:credentials.*.credentials_name|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
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
                    if (isset($credential['credentials_name']) && isset($credential['credentials_photo']) && $credential['credentials_photo'] instanceof \Illuminate\Http\UploadedFile) {
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
                'skills_id' => $request->skills_id ?? null,
                'credentials_name' => !empty($credentials_name) ? $credentials_name : null,
                'credentials_photo' => !empty($credentials_photo) ? $credentials_photo : null,
                'archived' => false,
            ]);

            Log::info('Worker created', [
                'worker_id' => $worker->id,
                'profile_id' => $profile->id,
                'skills_id' => $request->skills_id,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo
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

    public function update(Request $request, $id): JsonResponse
    {
        try {
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
                        'skills_id' => null,
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
                'work_type' => 'required|in:part-time,full-time,one-time',
                'skills_id' => 'nullable|array',
                'skills_id.*' => 'integer|exists:skills,id',
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
                'skills_id' => $request->skills_id ?? null,
                'credentials_name' => !empty($credentials_name) ? $credentials_name : null,
                'credentials_photo' => !empty($credentials_photo) ? $credentials_photo : null,
                'archived' => $user->archived,
            ]);

            Log::info('Worker updated', [
                'worker_id' => $user->worker->id,
                'skills_id' => $request->skills_id,
                'credentials_name' => $credentials_name,
                'credentials_photo' => $credentials_photo
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

    protected function formatWorker($user)
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'created_at' => $user->created_at->toIso8601String(),
            'updated_at' => $user->updated_at->toIso8601String(),
            'archived' => $user->archived,
            'profile' => $user->profile ? [
                'id' => $user->profile->id,
                'user_id' => $user->profile->user_id,
                'full_name' => trim("{$user->profile->first_name} {$user->profile->middlename} {$user->profile->last_name} " . ($user->profile->suffix ? $user->profile->suffix->suffix_name : '')),
                'first_name' => $user->profile->first_name,
                'middlename' => $user->profile->middlename,
                'last_name' => $user->profile->last_name,
                'gender_id' => $user->profile->gender_id,
                'suffix_id' => $user->profile->suffix_id,
                'suffix' => $user->profile->suffix ? $user->profile->suffix->suffix_name : '',
                'contact_number' => $user->profile->contact_number,
                'street' => $user->profile->street,
                'city' => $user->profile->city,
                'province' => $user->profile->province,
                'postal_code' => $user->profile->postal_code,
                'country' => $user->profile->country,
                'profile_img' => $user->profile->profile_img,
                'created_at' => $user->profile->created_at->toIso8601String(),
                'updated_at' => $user->profile->updated_at->toIso8601String(),
            ] : null,
            'worker' => $user->worker ? [
                'id' => $user->worker->id,
                'profile_id' => $user->worker->profile_id,
                'work_type' => $user->worker->work_type,
                'skills_id' => $user->worker->skills_id,
                'credentials_name' => $user->worker->credentials_name,
                'credentials_photo' => $user->worker->credentials_photo,
                'created_at' => $user->worker->created_at->toIso8601String(),
                'updated_at' => $user->worker->updated_at->toIso8601String(),
                'laravel_through_key' => $user->id,
            ] : null,
        ];
    }
}

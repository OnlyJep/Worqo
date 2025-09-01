<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Collection;
use App\Models\Suffix;

class WorkerController extends Controller
{
    /**
     * Fetch active workers with role_id = 1.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 5);

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

            // Create Profile and Worker records if they don't exist
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
                            'credentials_photo' => null,
                            'archived' => false,
                        ]
                    );
                }
            }

            // Re-fetch to include newly created records
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

            Log::info('Fetched active workers', ['count' => $workers->count(), 'page' => $page, 'limit' => $limit]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch archived workers with role_id = 1.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function archived(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 5);

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

            // Create Profile and Worker records if they don't exist
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
                            'credentials_photo' => null,
                            'archived' => true,
                        ]
                    );
                }
            }

            // Re-fetch to include newly created records
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

            Log::info('Fetched archived workers', ['count' => $workers->count(), 'page' => $page, 'limit' => $limit]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived workers: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch archived workers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch a single worker by ID with role_id = 1.
     *
     * @param int $id
     * @return JsonResponse
     */
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
                        'credentials_photo' => null,
                        'archived' => $user->archived,
                    ]
                );
                $user = User::with(['profile', 'worker'])
                    ->where('role_id', 1)
                    ->findOrFail($id);
            }

            Log::info('Fetched worker', ['id' => $id]);
            return response()->json($this->formatWorker($user), 200);
        } catch (\Exception $e) {
            Log::error('Error fetching worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Worker not found: ' . $e->getMessage()], 404);
        }
    }

    /**
     * Create a new worker with role_id = 1.
     *
     * @param Request $request
     * @return JsonResponse
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
                'work_type' => 'required|in:part-time,full-time,one-time',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'credentials_photo.*' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for worker creation', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['error' => $validator->errors()->first()], 400);
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
                $profileData['profile_img'] = $request->file('profile_img')->store('profiles', 'public');
            }

            $profile = Profile::create($profileData);

            $credentials = [];
            if ($request->hasFile('credentials_photo')) {
                foreach ($request->file('credentials_photo') as $file) {
                    $credentials[] = $file->store('credentials', 'public');
                }
            }

            $worker = Worker::create([
                'profile_id' => $profile->id,
                'work_type' => $request->work_type,
                'credentials_photo' => $credentials ?: null,
                'archived' => false,
            ]);

            Log::info('Worker created', ['worker_id' => $worker->id, 'profile_id' => $profile->id]);

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
     * Update an existing worker with role_id = 1.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
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
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'credentials_photo.*' => 'nullable|file|mimes:pdf,doc,docx,jpeg,png|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for worker update', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['error' => $validator->errors()->first()], 400);
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
                'city' => $request->city ?? $user->profile->city ?? 'Butuan City',
                'province' => $request->province ?? $user->profile->province ?? 'Agusan Del Norte',
                'postal_code' => $request->postal_code ?? $user->profile->postal_code ?? '8600',
                'country' => $request->country ?? $user->profile->country ?? 'Philippines',
            ];

            if ($request->hasFile('profile_img')) {
                if ($user->profile->profile_img) {
                    Storage::disk('public')->delete($user->profile->profile_img);
                }
                $profileData['profile_img'] = $request->file('profile_img')->store('profiles', 'public');
            }

            $user->profile->update($profileData);

            $credentials = $user->worker->credentials_photo ?? [];
            if ($request->hasFile('credentials_photo')) {
                foreach ($user->worker->credentials_photo ?? [] as $oldFile) {
                    Storage::disk('public')->delete($oldFile);
                }
                $credentials = [];
                foreach ($request->file('credentials_photo') as $file) {
                    $credentials[] = $file->store('credentials', 'public');
                }
            }

            $user->worker->update([
                'work_type' => $request->work_type,
                'credentials_photo' => $credentials ?: null,
                'archived' => $user->archived,
            ]);

            Log::info('Worker updated', ['worker_id' => $user->worker->id]);

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
     * Archive or restore a worker with role_id = 1.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
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

            if (!$user->worker) {
                Worker::updateOrCreate(
                    ['profile_id' => $user->profile->id],
                    [
                        'work_type' => 'part-time',
                        'credentials_photo' => null,
                        'archived' => $user->archived,
                    ]
                );
                $user = User::with(['profile', 'worker'])
                    ->where('role_id', 1)
                    ->findOrFail($id);
            }

            $archived = $request->input('archived', true);
            $user->update(['archived' => $archived]);
            $user->worker->update(['archived' => $archived]);

            Log::info('Worker archived/restored', ['id' => $id, 'archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Worker archived successfully' : 'Worker restored successfully',
                'worker' => $this->formatWorker($user->load(['profile', 'worker'])),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring worker: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to archive/restore worker: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk archive or restore workers with role_id = 1.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'worker_ids' => 'required|array',
                'worker_ids.*' => 'integer|exists:users,id',
                'action' => 'required|in:archive,restore',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk archive', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['error' => $validator->errors()->first()], 400);
            }

            $workerIds = $request->worker_ids;
            $archived = $request->action === 'archive';

            $users = User::with(['profile', 'worker'])
                ->where('role_id', 1)
                ->whereIn('id', $workerIds)
                ->get();

            foreach ($users as $user) {
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
                            'credentials_photo' => null,
                            'archived' => $archived,
                        ]
                    );
                }
            }

            $validWorkers = User::whereIn('id', $workerIds)
                ->where('role_id', 1)
                ->update(['archived' => $archived]);

            Worker::whereIn('profile_id', Profile::whereIn('user_id', $workerIds)->pluck('id'))
                ->update(['archived' => $archived]);

            Log::info('Bulk archive/restore completed', ['worker_ids' => $workerIds, 'archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Workers archived successfully' : 'Workers restored successfully',
                'affected' => $validWorkers,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in bulk archive/restore: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to perform bulk action: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Format worker data for response to match the provided JSON structure.
     *
     * @param User $user
     * @return array
     */
    protected function formatWorker(User $user): array
    {
        $suffix = $user->profile && $user->profile->suffix_id
            ? Suffix::find($user->profile->suffix_id)->suffix_name ?? ''
            : '';

        $fullName = trim(
            ($user->profile->first_name ?? 'N/A') . ' ' .
            ($user->profile->middlename ?? '') . ' ' .
            ($user->profile->last_name ?? 'N/A') . ' ' .
            $suffix
        );

        return [
            'id' => $user->id,
            'username' => $user->username ?? 'N/A',
            'email' => $user->email ?? 'N/A',
            'role_id' => $user->role_id,
            'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
            'updated_at' => $user->updated_at ? $user->updated_at->toIso8601String() : null,
            'archived' => $user->archived,
            'profile' => $user->profile ? [
                'id' => $user->profile->id,
                'user_id' => $user->profile->user_id,
                'full_name' => $fullName,
                'first_name' => $user->profile->first_name ?? 'N/A',
                'middlename' => $user->profile->middlename,
                'last_name' => $user->profile->last_name ?? 'N/A',
                'gender_id' => $user->profile->gender_id,
                'suffix_id' => $user->profile->suffix_id,
                'suffix' => $suffix,
                'contact_number' => $user->profile->contact_number,
                'street' => $user->profile->street,
                'city' => $user->profile->city ?? 'Butuan City',
                'province' => $user->profile->province ?? 'Agusan Del Norte',
                'postal_code' => $user->profile->postal_code ?? '8600',
                'country' => $user->profile->country ?? 'Philippines',
                'profile_img' => $user->profile->profile_img ? Storage::url($user->profile->profile_img) : null,
                'created_at' => $user->profile->created_at ? $user->profile->created_at->toIso8601String() : null,
                'updated_at' => $user->profile->updated_at ? $user->profile->updated_at->toIso8601String() : null,
            ] : null,
            'worker' => $user->worker ? [
                'id' => $user->worker->id,
                'profile_id' => $user->worker->profile_id,
                'work_type' => $user->worker->work_type,
                'credentials_photo' => $user->worker->credentials_photo ? array_map(fn($path) => Storage::url($path), $user->worker->credentials_photo) : [],
                'created_at' => $user->worker->created_at ? $user->worker->created_at->toIso8601String() : null,
                'updated_at' => $user->worker->updated_at ? $user->worker->updated_at->toIso8601String() : null,
                'laravel_through_key' => $user->worker->profile_id,
            ] : null,
        ];
    }
}
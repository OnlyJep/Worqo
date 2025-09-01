<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Suffix;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminListController extends Controller
{
    /**
     * Fetch active admins with role_id = 3.
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

            $query = User::with('profile')
                ->where('role_id', 3)
                ->where('archived', false);

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', 'like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

            $admins = $query->paginate($limit, ['*'], 'page', $page);

            // Create Profile records if they don't exist
            foreach ($admins as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Admin',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                }
            }

            // Re-fetch to include newly created records
            $admins = $query->paginate($limit, ['*'], 'page', $page);

            $response = [
                'admins' => collect($admins->items())->map(function ($user) {
                    return $this->formatAdmin($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $admins->currentPage(),
                    'totalPages' => $admins->lastPage(),
                    'totalItems' => $admins->total(),
                ],
            ];

            Log::info('Fetched active admins', ['count' => $admins->count(), 'page' => $page, 'limit' => $limit]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching admins: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch admins: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch archived admins with role_id = 3.
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

            $query = User::with('profile')
                ->where('role_id', 3)
                ->where('archived', true);

            if (!empty($search)) {
                $query->whereHas('profile', function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                      ->orWhere('middlename', 'like', '%' . $search . '%')
                      ->orWhere('last_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

            $admins = $query->paginate($limit, ['*'], 'page', $page);

            // Create Profile records if they don't exist
            foreach ($admins as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Admin',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                }
            }

            // Re-fetch to include newly created records
            $admins = $query->paginate($limit, ['*'], 'page', $page);

            $response = [
                'admins' => collect($admins->items())->map(function ($user) {
                    return $this->formatAdmin($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $admins->currentPage(),
                    'totalPages' => $admins->lastPage(),
                    'totalItems' => $admins->total(),
                ],
            ];

            Log::info('Fetched archived admins', ['count' => $admins->count(), 'page' => $page, 'limit' => $limit]);

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived admins: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch archived admins: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch a single admin by ID with role_id = 3.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with('profile')
                ->where('role_id', 3)
                ->findOrFail($id);

            if (!$user->profile) {
                $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => 'Unknown',
                    'last_name' => 'Admin',
                    'email' => $user->email,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                ]);
                $user = User::with('profile')
                    ->where('role_id', 3)
                    ->findOrFail($id);
            }

            Log::info('Fetched admin', ['id' => $id]);
            return response()->json($this->formatAdmin($user), 200);
        } catch (\Exception $e) {
            Log::error('Error fetching admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Admin not found: ' . $e->getMessage()], 404);
        }
    }

    /**
     * Create a new admin with role_id = 3.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix' => 'nullable|string|in:Jr,Sr,II,III,IV',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'required|integer|in:3',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for admin creation', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['error' => $validator->errors()->first()], 400);
            }

            $user = User::create([
                'username' => $request->username ?? strtolower($request->first_name . '.' . $request->last_name),
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role_id' => 3,
                'archived' => false,
            ]);

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'middlename' => $request->middlename,
                'last_name' => $request->last_name,
                'suffix' => $request->suffix,
                'email' => $request->email,
                'city' => 'Butuan City',
                'province' => 'Agusan Del Norte',
                'postal_code' => '8600',
                'country' => 'Philippines',
            ];

            if ($request->hasFile('profile_img')) {
                $profileData['profile_img'] = $request->file('profile_img')->store('profiles', 'public');
            }

            $profile = Profile::create($profileData);

            Log::info('Admin created', ['user_id' => $user->id, 'profile_id' => $profile->id]);

            return response()->json([
                'message' => 'Admin created successfully',
                'admin' => $this->formatAdmin($user->load('profile')),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to create admin: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing admin with role_id = 3.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = User::with('profile')
                ->where('role_id', 3)
                ->findOrFail($id);

            if (!$user->profile) {
                $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => $request->first_name ?? 'Unknown',
                    'last_name' => $request->last_name ?? 'Admin',
                    'email' => $user->email,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                ]);
                $user = User::with('profile')
                    ->where('role_id', 3)
                    ->findOrFail($id);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix' => 'nullable|string|in:Jr,Sr,II,III,IV',
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
                'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'required|integer|in:3',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for admin update', ['errors' => $validator->errors()->toArray()]);
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
                'suffix' => $request->suffix,
                'email' => $request->email,
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

            Log::info('Admin updated', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Admin updated successfully',
                'admin' => $this->formatAdmin($user->load('profile')),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to update admin: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Archive or restore an admin with role_id = 3.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
    {
        try {
            $user = User::with('profile')
                ->where('role_id', 3)
                ->findOrFail($id);

            if (!$user->profile) {
                $user->profile()->create([
                    'user_id' => $user->id,
                    'first_name' => 'Unknown',
                    'last_name' => 'Admin',
                    'email' => $user->email,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                ]);
                $user = User::with('profile')
                    ->where('role_id', 3)
                    ->findOrFail($id);
            }

            $archived = $request->input('archived', true);
            $user->update(['archived' => $archived]);

            Log::info('Admin archived/restored', ['id' => $id, 'archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Admin archived successfully' : 'Admin restored successfully',
                'admin' => $this->formatAdmin($user->load('profile')),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to archive/restore admin: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk archive or restore admins with role_id = 3.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'admin_ids' => 'required|array',
                'admin_ids.*' => 'integer|exists:users,id',
                'action' => 'required|in:archive,restore',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk archive', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['error' => $validator->errors()->first()], 400);
            }

            $adminIds = $request->admin_ids;
            $archived = $request->action === 'archive';

            $users = User::with('profile')
                ->where('role_id', 3)
                ->whereIn('id', $adminIds)
                ->get();

            foreach ($users as $user) {
                if (!$user->profile) {
                    $user->profile()->create([
                        'user_id' => $user->id,
                        'first_name' => 'Unknown',
                        'last_name' => 'Admin',
                        'email' => $user->email,
                        'city' => 'Butuan City',
                        'province' => 'Agusan Del Norte',
                        'postal_code' => '8600',
                        'country' => 'Philippines',
                    ]);
                }
            }

            $validAdmins = User::whereIn('id', $adminIds)
                ->where('role_id', 3)
                ->update(['archived' => $archived]);

            Log::info('Bulk archive/restore completed', ['admin_ids' => $adminIds, 'archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Admins archived successfully' : 'Admins restored successfully',
                'affected' => $validAdmins,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in bulk archive/restore: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to perform bulk action: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Format admin data for response to match the frontend expectations.
     *
     * @param User $user
     * @return array
     */
    protected function formatAdmin(User $user): array
    {
        $suffix = $user->profile && $user->profile->suffix
            ? $user->profile->suffix
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
            'role_name' => 'Admin',
            'first_name' => $user->profile->first_name ?? 'N/A',
            'middlename' => $user->profile->middlename,
            'last_name' => $user->profile->last_name ?? 'N/A',
            'suffix' => $suffix,
            'full_name' => $fullName,
            'profile_img' => $user->profile->profile_img ? Storage::url($user->profile->profile_img) : null,
            'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
            'updated_at' => $user->updated_at ? $user->updated_at->toIso8601String() : null,
            'archived' => $user->archived,
        ];
    }
}
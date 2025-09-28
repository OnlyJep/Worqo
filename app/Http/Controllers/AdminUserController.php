<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Role;
use App\Models\Gender;
use App\Models\Suffix;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AdminUserController extends Controller
{
    /**
     * Display a listing of users with optional search, archived filter, and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $archived = $request->query('archived', null);
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 5);

            $query = User::with(['role', 'profile.gender', 'profile.suffix']);

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('username', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

            if (!is_null($archived)) {
                $query->where('archived', filter_var($archived, FILTER_VALIDATE_BOOLEAN));
            }

            $users = $query->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'users' => collect($users->items())->map(function ($user) {
                    return $this->formatUserResponse($user);
                })->toArray(),
                'pagination' => [
                    'currentPage' => $users->currentPage(),
                    'totalPages' => $users->lastPage(),
                    'totalItems' => $users->total(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to fetch users']], 500);
        }
    }

    /**
     * Display a listing of archived users.
     *
     * @return JsonResponse
     */
    public function archived(): JsonResponse
    {
        try {
            $users = User::where('archived', true)
                ->with(['role', 'profile.gender', 'profile.suffix'])
                ->get()
                ->map(function ($user) {
                    return $this->formatUserResponse($user);
                });

            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived users: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to fetch archived users']], 500);
        }
    }

    /**
     * Display a specific user.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with(['role', 'profile.gender', 'profile.suffix'])->findOrFail($id);
            return response()->json($this->formatUserResponse($user), 200);
        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'User not found']], 404);
        }
    }

    /**
     * Store a new user and their profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('User creation request received:', [
                'data' => $request->all(),
                'files' => $request->hasFile('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file detected',
            ]);

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'required|integer|exists:roles,id',
                'gender_id' => 'required|integer|exists:genders,id',
                'suffix_id' => 'nullable|integer|exists:suffixes,id',
                'contact_number' => 'nullable|string|max:20',
                'street' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for user creation:', $validator->errors()->toArray());
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $validated = $validator->validated();
            $username = strtolower($validated['first_name'] . '.' . $validated['last_name']);
            $usernameCount = User::where('username', $username)->count();
            $uniqueUsername = $usernameCount > 0 ? $username . '.' . time() : $username;

            $userData = [
                'username' => $uniqueUsername,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => (int)$validated['role_id'],
                'archived' => false,
            ];

            $user = User::create($userData);

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'middlename' => $validated['middlename'] ?? null,
                'last_name' => $validated['last_name'],
                'gender_id' => (int)$validated['gender_id'],
                'suffix_id' => $validated['suffix_id'] ?? null,
                'contact_number' => $validated['contact_number'] ?? null,
                'street' => $validated['street'] ?? null,
                'city' => $validated['city'] ?? null,
                'province' => $validated['province'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? null,
            ];

            if ($request->hasFile('profile_img')) {
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
                Log::info('Profile image uploaded', ['new_file' => $path]);
            }

            Profile::create($profileData);

            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => $this->formatUserResponse($user),
                'message' => 'User created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to create user']], 500);
        }
    }

    /**
     * Update an existing user and their profile.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $profile = Profile::where('user_id', $id)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'nullable|integer|exists:roles,id',
                'gender_id' => 'nullable|numeric|exists:genders,id',
                'suffix_id' => 'nullable|numeric|exists:suffixes,id',
                'contact_number' => 'nullable|string|max:20',
                'street' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for user update:', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all(),
                    'user_id' => $id,
                ]);
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $validated = $validator->validated();

            // Normalize empty strings to null for nullable fields
            $nullableFields = [
                'middlename', 'suffix_id', 'contact_number',
                'street', 'city', 'province', 'postal_code', 'country'
            ];
            foreach ($nullableFields as $field) {
                if (isset($validated[$field]) && $validated[$field] === '') {
                    $validated[$field] = null;
                }
            }

            // Prepare user data
            $userData = [
                'email' => $validated['email'],
            ];
            
            // Only update role_id if provided
            if (isset($validated['role_id']) && $validated['role_id']) {
                $userData['role_id'] = (int)$validated['role_id'];
            }
            if (isset($validated['password']) && $validated['password']) {
                $userData['password'] = Hash::make($validated['password']);
            }

            // Update username
            $firstName = $validated['first_name'];
            $lastName = $validated['last_name'];
            $newUsername = strtolower($firstName . '.' . $lastName);
            $usernameCount = User::where('username', $newUsername)->where('id', '!=', $id)->count();
            $userData['username'] = $usernameCount > 0 ? $newUsername . '.' . $id : $newUsername;

            // Prepare profile data
            $profileData = [
                'first_name' => $validated['first_name'],
                'middlename' => $validated['middlename'] ?? $profile->middlename,
                'last_name' => $validated['last_name'],
                'gender_id' => isset($validated['gender_id']) && $validated['gender_id'] ? (int)$validated['gender_id'] : $profile->gender_id,
                'suffix_id' => $validated['suffix_id'] ?? $profile->suffix_id,
                'contact_number' => $validated['contact_number'] ?? $profile->contact_number,
                'street' => $validated['street'] ?? $profile->street,
                'city' => $validated['city'] ?? $profile->city,
                'province' => $validated['province'] ?? $profile->province,
                'postal_code' => $validated['postal_code'] ?? $profile->postal_code,
                'country' => $validated['country'] ?? $profile->country,
            ];

            // Handle profile image
            if ($request->hasFile('profile_img')) {
                if ($profile->profile_img && $profile->profile_img !== 'img/defaultpfp.jpg') {
                    Storage::disk('public')->delete($profile->profile_img);
                    Log::info('Deleted old profile image', ['old_file' => $profile->profile_img]);
                }
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
                Log::info('Profile image uploaded', ['new_file' => $path]);
            } elseif ($request->input('profile_img') === '') {
                if ($profile->profile_img && $profile->profile_img !== 'img/defaultpfp.jpg') {
                    Storage::disk('public')->delete($profile->profile_img);
                    Log::info('Deleted profile image', ['old_file' => $profile->profile_img]);
                }
                $profileData['profile_img'] = null;
            } elseif ($request->input('profile_img') === 'default') {
                if ($profile->profile_img && $profile->profile_img !== 'img/defaultpfp.jpg') {
                    Storage::disk('public')->delete($profile->profile_img);
                    Log::info('Deleted old profile image, setting to default', ['old_file' => $profile->profile_img]);
                }
                $profileData['profile_img'] = 'img/defaultpfp.jpg';
                Log::info('Profile image set to default');
            }

            // Begin transaction
            DB::beginTransaction();

            $user->fill($userData);
            $user->save();
            Log::info('User updated:', ['changes' => $user->getChanges()]);

            $profile->fill($profileData);
            $profile->save();
            Log::info('Profile updated:', ['changes' => $profile->getChanges()]);

            DB::commit();

            // Force refresh the user and its relationships
            $user->refresh();
            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => $this->formatUserResponse($user),
                'message' => 'User updated successfully',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::warning('Validation error:', [
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            return response()->json(['messages' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to update user']], 500);
        }
    }

    /**
     * Archive or restore a user.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'archived' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for archive:', $validator->errors()->toArray());
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $user = User::findOrFail($id);
            $user->update(['archived' => $request->archived]);

            return response()->json([
                'message' => $request->archived ? 'User archived successfully' : 'User restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to archive/restore user']], 500);
        }
    }

    /**
     * Bulk archive or restore users.
     *
     * @param Request $request
     * @return JsonResponse
     */
public function bulkArchive(Request $request): JsonResponse
{
    try {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
            'action' => 'required|in:archive,restore',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for bulk archive:', $validator->errors()->toArray());
            return response()->json(['messages' => $validator->errors()], 422);
        }

        $userIds = $request->user_ids;
        $archived = $request->action === 'archive';

        User::whereIn('id', $userIds)->update(['archived' => $archived]);

        return response()->json([
            'message' => $archived ? 'Users archived successfully' : 'Users restored successfully',
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error in bulk archive/restore: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return response()->json(['messages' => ['general' => 'Failed to perform bulk action']], 500);
    }
}

    /**
     * Helper method to format user response.
     *
     * @param User $user
     * @return array
     */
    private function formatUserResponse($user)
    {
        $profile = $user->profile;
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'role_name' => $user->role ? $user->role->role_name : null,
            'gender_id' => $profile ? $profile->gender_id : null,
            'gender_name' => $profile && $profile->gender ? $profile->gender->gender_name : null,
            'suffix_id' => $profile ? $profile->suffix_id : null,
            'suffix_name' => $profile && $profile->suffix ? $profile->suffix->suffix_name : null,
            'first_name' => $profile ? $profile->first_name : null,
            'middlename' => $profile ? $profile->middlename : null,
            'last_name' => $profile ? $profile->last_name : null,
            'contact_number' => $profile ? $profile->contact_number : null,
            'street' => $profile ? $profile->street : null,
            'city' => $profile ? $profile->city : null,
            'province' => $profile ? $profile->province : null,
            'postal_code' => $profile ? $profile->postal_code : null,
            'country' => $profile ? $profile->country : null,
            'profile_img' => $profile ? $profile->profile_img : null,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'archived' => $user->archived,
        ];
    }

    /**
     * Switch user role between Worker (1) and Employer (2)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function switchUserRole(Request $request): JsonResponse
    {
        try {
            // Get user ID from request
            $userId = $request->user_id;
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID is required'
                ], 400);
            }
            
            $user = User::find($userId);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Validate the new role_id
            $validator = Validator::make($request->all(), [
                'role_id' => 'required|integer|in:1,2'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newRoleId = $request->role_id;
            
            // Check if user is trying to switch to the same role
            if ($user->role_id == $newRoleId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already assigned to this role'
                ], 400);
            }

            // Update the user's role
            $user->role_id = $newRoleId;
            $user->save();

            // Get the role name
            $role = Role::find($newRoleId);
            $roleName = $role ? $role->role_name : ($newRoleId == 1 ? 'Worker' : 'Employer');

            // Return updated user data
            return response()->json([
                'success' => true,
                'message' => 'Role switched successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $roleName,
                    'updated_at' => $user->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Role switch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to switch role'
            ], 500);
        }
    }
}
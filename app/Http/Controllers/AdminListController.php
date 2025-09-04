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

class AdminListController extends Controller
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

            $query = User::with(['role', 'profile.gender', 'profile.suffix'])
                ->where('role_id', 3); // Only fetch Admins

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
            Log::error('Error fetching admins: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to fetch admins']], 500);
        }
    }

    /**
     * Display a listing of archived admins.
     *
     * @return JsonResponse
     */
    public function archived(): JsonResponse
    {
        try {
            $users = User::where('archived', true)
                ->where('role_id', 3)
                ->with(['role', 'profile.gender', 'profile.suffix'])
                ->get()
                ->map(function ($user) {
                    return $this->formatUserResponse($user);
                });

            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived admins: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to fetch archived admins']], 500);
        }
    }

    /**
     * Display a specific admin.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with(['role', 'profile.gender', 'profile.suffix'])
                ->where('role_id', 3)
                ->findOrFail($id);
            return response()->json($this->formatUserResponse($user), 200);
        } catch (\Exception $e) {
            Log::error('Error fetching admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Admin not found']], 404);
        }
    }

    /**
     * Store a new admin and their profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Admin creation request received:', [
                'data' => $request->all(),
                'files' => $request->hasFile('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file detected',
            ]);

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'gender_id' => 'required|integer|exists:genders,id',
                'suffix_id' => 'nullable|integer|exists:suffixes,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for admin creation:', $validator->errors()->toArray());
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
                'role_id' => 3, // Fixed to Admin role
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
                'message' => 'Admin created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to create admin']], 500);
        }
    }

    /**
     * Update an existing admin and their profile.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Admin update request received:', [
                'user_id' => $id,
                'data' => $request->all(),
                'files' => $request->hasFile('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file detected',
            ]);

            $user = User::where('role_id', 3)->findOrFail($id);
            $profile = Profile::where('user_id', $id)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'gender_id' => 'required|integer|exists:genders,id',
                'suffix_id' => 'nullable|integer|exists:suffixes,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for admin update:', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all(),
                ]);
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $validated = $validator->validated();

            // Normalize empty strings to null for nullable fields
            $nullableFields = ['middlename', 'suffix_id'];
            foreach ($nullableFields as $field) {
                if (isset($validated[$field]) && $validated[$field] === '') {
                    $validated[$field] = null;
                }
            }

            // Prepare user data
            $userData = [
                'email' => $validated['email'],
                'role_id' => 3, // Fixed to Admin role
            ];
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
                'gender_id' => (int)$validated['gender_id'],
                'suffix_id' => $validated['suffix_id'] ?? $profile->suffix_id,
            ];

            // Handle profile image
            if ($request->hasFile('profile_img')) {
                if ($profile->profile_img) {
                    Storage::disk('public')->delete($profile->profile_img);
                    Log::info('Deleted old profile image', ['old_file' => $profile->profile_img]);
                }
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
                Log::info('Profile image uploaded', ['new_file' => $path]);
            } elseif ($request->input('profile_img') === '') {
                if ($profile->profile_img) {
                    Storage::disk('public')->delete($profile->profile_img);
                    Log::info('Deleted profile image', ['old_file' => $profile->profile_img]);
                }
                $profileData['profile_img'] = null;
            }

            // Begin transaction
            DB::beginTransaction();

            $user->fill($userData);
            $user->save();
            Log::info('Admin updated:', ['changes' => $user->getChanges()]);

            $profile->fill($profileData);
            $profile->save();
            Log::info('Profile updated:', ['changes' => $profile->getChanges()]);

            DB::commit();

            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => $this->formatUserResponse($user),
                'message' => 'Admin updated successfully',
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
            Log::error('Error updating admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to update admin']], 500);
        }
    }

    /**
     * Archive or restore an admin.
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

            $user = User::where('role_id', 3)->findOrFail($id);
            $user->update(['archived' => $request->archived]);

            return response()->json([
                'message' => $request->archived ? 'Admin archived successfully' : 'Admin restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring admin: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to archive/restore admin']], 500);
        }
    }

    /**
     * Bulk archive or restore admins.
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

            User::whereIn('id', $userIds)
                ->where('role_id', 3)
                ->update(['archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Admins archived successfully' : 'Admins restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in bulk archive/restore: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['messages' => ['general' => 'Failed to perform bulk action']], 500);
        }
    }

    /**
     * Helper method to format admin response.
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
            'gender_name' => $profile && $profile->gender ? $profile->gender->name : null,
            'suffix_id' => $profile ? $profile->suffix_id : null,
            'suffix_name' => $profile && $profile->suffix ? $profile->suffix->suffix_name : null,
            'first_name' => $profile ? $profile->first_name : null,
            'middlename' => $profile ? $profile->middlename : null,
            'last_name' => $profile ? $profile->last_name : null,
            'profile_img' => $profile ? $profile->profile_img : null,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'archived' => $user->archived,
        ];
    }
}
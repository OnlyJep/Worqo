<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Role;
use App\Models\Gender;
use App\Models\Suffix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    /**
     * Display a listing of active users.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $users = User::where('archived', false)
                ->with(['role', 'profile.gender', 'profile.suffix'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role_id' => $user->role_id,
                        'role_name' => $user->role ? $user->role->role_name : null,
                        'gender_id' => $user->profile ? $user->profile->gender_id : null,
                        'gender_name' => $user->profile && $user->profile->gender ? $user->profile->gender->name : null,
                        'suffix_id' => $user->profile ? $user->profile->suffix_id : null,
                        'suffix_name' => $user->profile && $user->profile->suffix ? $user->profile->suffix->suffix_name : null,
                        'first_name' => $user->profile ? $user->profile->first_name : null,
                        'middlename' => $user->profile ? $user->profile->middlename : null,
                        'last_name' => $user->profile ? $user->profile->last_name : null,
                        'profile_img' => $user->profile ? $user->profile->profile_img : null,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ];
                });

            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching active users: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * Display a listing of archived users.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function archived()
    {
        try {
            $users = User::where('archived', true)
                ->with(['role', 'profile.gender', 'profile.suffix'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role_id' => $user->role_id,
                        'role_name' => $user->role ? $user->role->role_name : null,
                        'gender_id' => $user->profile ? $user->profile->gender_id : null,
                        'gender_name' => $user->profile && $user->profile->gender ? $user->profile->gender->name : null,
                        'suffix_id' => $user->profile ? $user->profile->suffix_id : null,
                        'suffix_name' => $user->profile && $user->profile->suffix ? $user->profile->suffix->suffix_name : null,
                        'first_name' => $user->profile ? $user->profile->first_name : null,
                        'middlename' => $user->profile ? $user->profile->middlename : null,
                        'last_name' => $user->profile ? $user->profile->last_name : null,
                        'profile_img' => $user->profile ? $user->profile->profile_img : null,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ];
                });

            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching archived users: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * Display a specific user.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $user = User::with(['role', 'profile.gender', 'profile.suffix'])->findOrFail($id);

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'role_name' => $user->role ? $user->role->role_name : null,
                'gender_id' => $user->profile ? $user->profile->gender_id : null,
                'gender_name' => $user->profile && $user->profile->gender ? $user->profile->gender->name : null,
                'suffix_id' => $user->profile ? $user->profile->suffix_id : null,
                'suffix_name' => $user->profile && $user->profile->suffix ? $user->profile->suffix->suffix_name : null,
                'first_name' => $user->profile ? $user->profile->first_name : null,
                'middlename' => $user->profile ? $user->profile->middlename : null,
                'last_name' => $user->profile ? $user->profile->last_name : null,
                'profile_img' => $user->profile ? $user->profile->profile_img : null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage());
            return response()->json(['message' => 'User not found'], 404);
        }
    }

    /**
     * Store a new user and their profile.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'required|exists:roles,id',
                'gender_id' => 'required|exists:genders,id',
                'suffix_id' => 'nullable|exists:suffixes,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $userData = [
                'username' => Str::slug($request->first_name . ' ' . $request->last_name),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $request->role_id,
                'archived' => false,
            ];

            $user = User::create($userData);

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'middlename' => $request->middlename,
                'last_name' => $request->last_name,
                'gender_id' => $request->gender_id,
                'suffix_id' => $request->suffix_id ?: null,
            ];

            if ($request->hasFile('profile_img')) {
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
            }

            $profile = Profile::create($profileData);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role ? $user->role->role_name : null,
                    'gender_id' => $profile->gender_id,
                    'gender_name' => $profile->gender ? $profile->gender->name : null,
                    'suffix_id' => $profile->suffix_id,
                    'suffix_name' => $profile->suffix ? $profile->suffix->suffix_name : null,
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'profile_img' => $profile->profile_img,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
                'message' => 'User created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * Update an existing user and their profile.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $profile = Profile::where('user_id', $id)->firstOrFail();

            // Log the incoming request data for debugging
            Log::info('Update request data:', $request->all());

            // Validation rules for update: all fields are optional
            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'sometimes|exists:roles,id',
                'gender_id' => 'sometimes|exists:genders,id',
                'suffix_id' => 'nullable|exists:suffixes,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed:', $validator->errors()->toArray());
                return response()->json(['messages' => $validator->errors()], 422);
            }

            // Prepare user data for update
            $userData = [];
            if ($request->filled('email')) {
                $userData['email'] = $request->email;
            }
            if ($request->filled('role_id')) {
                $userData['role_id'] = $request->role_id;
            }
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            // Update username if first_name or last_name is provided
            if ($request->filled('first_name') || $request->filled('last_name')) {
                $firstName = $request->filled('first_name') ? $request->first_name : $profile->first_name;
                $lastName = $request->filled('last_name') ? $request->last_name : $profile->last_name;
                $userData['username'] = Str::slug($firstName . ' ' . $lastName);
            }

            // Prepare profile data for update
            $profileData = [];
            if ($request->filled('first_name')) {
                $profileData['first_name'] = $request->first_name;
            }
            if ($request->has('middlename')) {
                $profileData['middlename'] = $request->middlename ?: null;
            }
            if ($request->filled('last_name')) {
                $profileData['last_name'] = $request->last_name;
            }
            if ($request->filled('gender_id')) {
                $profileData['gender_id'] = $request->gender_id;
            }
            if ($request->has('suffix_id')) {
                $profileData['suffix_id'] = $request->suffix_id ?: null;
            }
            if ($request->hasFile('profile_img')) {
                if ($profile->profile_img) {
                    Storage::disk('public')->delete($profile->profile_img);
                }
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
            }

            // Update only if there are changes
            if (!empty($userData)) {
                $user->update($userData);
                Log::info('User updated:', $userData);
            } else {
                Log::info('No user data to update');
            }

            if (!empty($profileData)) {
                $profile->update($profileData);
                Log::info('Profile updated:', $profileData);
            } else {
                Log::info('No profile data to update');
            }

            // Refresh relationships to ensure updated data
            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role ? $user->role->role_name : null,
                    'gender_id' => $profile->gender_id,
                    'gender_name' => $profile->gender ? $profile->gender->name : null,
                    'suffix_id' => $profile->suffix_id,
                    'suffix_name' => $profile->suffix ? $profile->suffix->suffix_name : null,
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'profile_img' => $profile->profile_img,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
                'message' => 'User updated successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * Archive or restore a user.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function archive(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'archived' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $user = User::findOrFail($id);
            $user->update(['archived' => $request->archived]);

            return response()->json([
                'message' => $request->archived ? 'User archived successfully' : 'User restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring user: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }
}
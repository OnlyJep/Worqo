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
                    return $this->formatUserResponse($user);
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
                    return $this->formatUserResponse($user);
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
            return response()->json($this->formatUserResponse($user), 200);
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
                'contact_number' => 'nullable|string|max:20',
                'street' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $validated = $validator->validated();
            $username = strtolower($validated['first_name'] . '.' . $validated['last_name']);

            $userData = [
                'username' => $username,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => $validated['role_id'],
                'archived' => false,
            ];

            $user = User::create($userData);

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'middlename' => $validated['middlename'] ?? null,
                'last_name' => $validated['last_name'],
                'gender_id' => $validated['gender_id'],
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
            }

            $profile = Profile::create($profileData);

            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => $this->formatUserResponse($user),
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

            Log::info('Update request data:', $request->all());

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'sometimes|required|exists:roles,id',
                'gender_id' => 'sometimes|required|exists:genders,id',
                'suffix_id' => 'nullable|exists:suffixes,id',
                'contact_number' => 'nullable|string|max:20',
                'street' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed:', $validator->errors()->toArray());
                return response()->json(['messages' => $validator->errors()], 422);
            }

            $validated = $validator->validated();

            // Prepare user data
            $userData = [
                'email' => $validated['email'] ?? $user->email,
                'role_id' => $validated['role_id'] ?? $user->role_id,
            ];
            if (isset($validated['password']) && $validated['password']) {
                $userData['password'] = Hash::make($validated['password']);
            }

            // Always update username based on first_name and last_name
            $firstName = $validated['first_name'] ?? $profile->first_name;
            $lastName = $validated['last_name'] ?? $profile->last_name;
            $newUsername = strtolower($firstName . '.' . $lastName);
            if ($newUsername !== $user->username) {
                $userData['username'] = $newUsername;
            }

            // Prepare profile data
            $profileData = [
                'first_name' => $validated['first_name'] ?? $profile->first_name,
                'middlename' => $validated['middlename'] ?? $profile->middlename,
                'last_name' => $validated['last_name'] ?? $profile->last_name,
                'gender_id' => $validated['gender_id'] ?? $profile->gender_id,
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
                if ($profile->profile_img) {
                    Storage::disk('public')->delete($profile->profile_img);
                }
                $path = $request->file('profile_img')->store('profiles', 'public');
                $profileData['profile_img'] = $path;
            } elseif ($request->has('profile_img') && $request->input('profile_img') === '') {
                if ($profile->profile_img) {
                    Storage::disk('public')->delete($profile->profile_img);
                }
                $profileData['profile_img'] = null;
            }

            $updated = false;

            // Attempt to update user
            if ($user->fill($userData)->isDirty()) {
                if ($user->save()) {
                    Log::info('User updated:', $userData);
                    $updated = true;
                } else {
                    Log::warning('Failed to update user:', $userData);
                }
            } else {
                Log::info('No changes detected for user:', $userData);
            }

            // Attempt to update profile
            if ($profile->fill($profileData)->isDirty()) {
                if ($profile->save()) {
                    Log::info('Profile updated:', $profileData);
                    $updated = true;
                } else {
                    Log::warning('Failed to update profile:', $profileData);
                }
            } else {
                Log::info('No changes detected for profile:', $profileData);
            }

            if (!$updated) {
                Log::info('No changes were made to user or profile');
                return response()->json([
                    'user' => $this->formatUserResponse($user),
                    'message' => 'No changes were made',
                ], 200);
            }

            $user->load(['role', 'profile.gender', 'profile.suffix']);

            return response()->json([
                'user' => $this->formatUserResponse($user),
                'message' => 'User updated successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
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
            'gender_name' => $profile && $profile->gender ? $profile->gender->name : null,
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
        ];
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
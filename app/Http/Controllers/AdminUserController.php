<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminUserController extends Controller
{
    public function getUsers(): JsonResponse
    {
        try {
            $users = User::where('users.archived', false)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.archived',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->get();
            Log::info('Fetched active users', ['count' => $users->count()]);
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error in getUsers: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'query' => 'SELECT users.id, users.id as user_id, users.role_id, profiles.first_name, profiles.middlename, profiles.last_name, profiles.gender_id, profiles.suffix_id, profiles.contact_number, profiles.street, profiles.city, profiles.province, profiles.postal_code, profiles.country, profiles.profile_img, users.created_at, users.updated_at, users.archived, users.username, users.email, roles.role_name FROM users JOIN roles ON users.role_id = roles.id LEFT JOIN profiles ON users.id = profiles.user_id WHERE users.archived = 0'
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function getArchivedUsers(): JsonResponse
    {
        try {
            $users = User::where('users.archived', true)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.archived',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->get();
            Log::info('Fetched archived users', ['count' => $users->count()]);
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error in getArchivedUsers: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'query' => 'SELECT users.id, users.id as user_id, users.role_id, profiles.first_name, profiles.middlename, profiles.last_name, profiles.gender_id, profiles.suffix_id, profiles.contact_number, profiles.street, profiles.city, profiles.province, profiles.postal_code, profiles.country, profiles.profile_img, users.created_at, users.updated_at, users.archived, users.username, users.email, roles.role_name FROM users JOIN roles ON users.role_id = roles.id LEFT JOIN profiles ON users.id = profiles.user_id WHERE users.archived = 1'
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function archive(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->archived = $request->input('archived', false);
            $user->save();
            Log::info('User archived status updated', ['user_id' => $id, 'archived' => $user->archived]);
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('Error in archive user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function getUserList(): JsonResponse
    {
        try {
            $users = User::whereIn('role_id', [1, 2, 3])
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->get();
            Log::info('Fetched user list', ['count' => $users->count()]);
            return response()->json(['users' => $users]);
        } catch (\Exception $e) {
            Log::error('Error in getUserList: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('User update request received:', [
                'data' => $request->all(),
                'files' => $request->hasFile('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file detected',
                'raw_input' => $request->input(),
            ]);

            $user = User::findOrFail($id);
            $profile = Profile::where('user_id', $id)->firstOrFail();

            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix_id' => 'nullable|exists:suffixes,id',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8',
                'role_id' => 'required|exists:roles,id',
                'gender_id' => 'required|exists:genders,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            // Generate username from first_name and last_name
            $baseUsername = strtolower(
                str_replace(' ', '', $validated['first_name']) . '.' .
                str_replace(' ', '', $validated['last_name'])
            );
            $username = $baseUsername;
            $counter = 1;
            while (User::where('username', $username)->where('id', '!=', $id)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }

            $user->update([
                'email' => $validated['email'],
                'role_id' => $validated['role_id'],
                'username' => $username,
                'password' => $request->password ? Hash::make($request->password) : $user->password,
            ]);

            $profileData = [
                'first_name' => $validated['first_name'],
                'middlename' => $validated['middlename'] ?? null,
                'last_name' => $validated['last_name'],
                'suffix_id' => $validated['suffix_id'] ? (int)$validated['suffix_id'] : null,
                'gender_id' => (int)$validated['gender_id'],
                'contact_number' => $request->input('contact_number') ?? null,
                'street' => $request->input('street') ?? null,
                'city' => $request->input('city') ?? null,
                'province' => $request->input('province') ?? null,
                'postal_code' => $request->input('postal_code') ?? null,
                'country' => $request->input('country') ?? null,
            ];

            if ($request->hasFile('profile_img')) {
                Log::info('Processing profile image upload', ['file' => $request->file('profile_img')->getClientOriginalName()]);
                if ($profile->profile_img && file_exists(public_path($profile->profile_img))) {
                    unlink(public_path($profile->profile_img));
                    Log::info('Deleted old profile image', ['old_file' => $profile->profile_img]);
                }
                $image = $request->file('profile_img');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $destinationPath = public_path('images/pfp/');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                    Log::info('Created directory', ['path' => $destinationPath]);
                }
                $image->move($destinationPath, $imageName);
                $fullPath = 'images/pfp/' . $imageName;
                Log::info('Image moved to:', ['path' => public_path($fullPath)]);
                if (file_exists(public_path($fullPath))) {
                    Log::info('File confirmed exists', ['file' => $fullPath]);
                } else {
                    Log::error('File not found after moving', ['file' => $fullPath]);
                }
                $profileData['profile_img'] = $fullPath;
                Log::info('Profile data updated with new image', ['new_file' => $fullPath]);
            }

            $profile->fill($profileData)->save();
            Log::info('Profile saved to database', ['profile' => $profile->toArray()]);

            $updatedUser = User::where('users.id', $id)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.archived',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->firstOrFail();

            Log::info('User updated successfully', ['user_id' => $id, 'username' => $updatedUser->username, 'profile_img' => $updatedUser->profile_img]);
            return response()->json(['user' => $updatedUser, 'message' => 'User updated successfully'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in user update:', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
                'files' => $request->file('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file'
            ]);
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('User creation request received:', [
                'data' => $request->all(),
                'files' => $request->hasFile('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file detected',
                'raw_input' => $request->input(),
            ]);

            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix_id' => 'nullable|exists:suffixes,id',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:8',
                'role_id' => 'required|exists:roles,id',
                'gender_id' => 'required|exists:genders,id',
                'profile_img' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            // Generate username from first_name and last_name
            $baseUsername = strtolower(
                str_replace(' ', '', $validated['first_name']) . '.' .
                str_replace(' ', '', $validated['last_name'])
            );
            $username = $baseUsername;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }

            $user = new User();
            $user->email = $validated['email'];
            $user->role_id = $validated['role_id'];
            $user->username = $username;
            $user->password = Hash::make($validated['password']);
            $user->save();

            $profileData = [
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'middlename' => $validated['middlename'] ?? null,
                'last_name' => $validated['last_name'],
                'suffix_id' => $validated['suffix_id'] ? (int)$validated['suffix_id'] : null,
                'gender_id' => (int)$validated['gender_id'],
                'contact_number' => $request->input('contact_number') ?? null,
                'street' => $request->input('street') ?? null,
                'city' => $request->input('city') ?? null,
                'province' => $request->input('province') ?? null,
                'postal_code' => $request->input('postal_code') ?? null,
                'country' => $request->input('country') ?? null,
            ];

            if ($request->hasFile('profile_img')) {
                Log::info('Processing profile image upload', ['file' => $request->file('profile_img')->getClientOriginalName()]);
                $image = $request->file('profile_img');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $destinationPath = public_path('images/pfp/');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                    Log::info('Created directory', ['path' => $destinationPath]);
                }
                $image->move($destinationPath, $imageName);
                $fullPath = 'images/pfp/' . $imageName;
                Log::info('Image moved to:', ['path' => public_path($fullPath)]);
                if (file_exists(public_path($fullPath))) {
                    Log::info('File confirmed exists', ['file' => $fullPath]);
                } else {
                    Log::error('File not found after moving', ['file' => $fullPath]);
                }
                $profileData['profile_img'] = $fullPath;
                Log::info('Profile data updated with new image', ['new_file' => $fullPath]);
            }

            $profile = new Profile($profileData);
            $profile->save();
            Log::info('Profile saved to database', ['profile' => $profile->toArray()]);

            $createdUser = User::where('users.id', $user->id)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.archived',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->firstOrFail();

            Log::info('User created successfully', ['user_id' => $user->id, 'username' => $createdUser->username, 'profile_img' => $createdUser->profile_img]);
            return response()->json(['user' => $createdUser, 'message' => 'User created successfully'], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in user creation:', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
                'files' => $request->file('profile_img') ? 'File present: ' . $request->file('profile_img')->getClientOriginalName() : 'No file'
            ]);
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function getUser($id): JsonResponse
    {
        try {
            $user = User::where('users.id', $id)
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->select(
                    'users.id',
                    'users.id as user_id',
                    'users.role_id',
                    'profiles.first_name',
                    'profiles.middlename',
                    'profiles.last_name',
                    'profiles.gender_id',
                    'profiles.suffix_id',
                    'profiles.contact_number',
                    'profiles.street',
                    'profiles.city',
                    'profiles.province',
                    'profiles.postal_code',
                    'profiles.country',
                    'profiles.profile_img',
                    'users.created_at',
                    'users.updated_at',
                    'users.archived',
                    'users.username',
                    'users.email',
                    'roles.role_name'
                )
                ->firstOrFail();
            Log::info('Fetched single user', ['user_id' => $id]);
            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'User not found'], 404);
        }
    }
}
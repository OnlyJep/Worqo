<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Gender;
use App\Models\Role;
use App\Models\Suffix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    /**
     * Register a new user and create their profile.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        DB::beginTransaction();
        try {
            // Define validation rules
            $rules = [
                'first_name' => 'required|string|max:255|min:2',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255|min:2',
                'gender' => ['required', Rule::exists('genders', 'gender_name')],
                'suffix' => ['nullable', Rule::exists('suffixes', 'suffix_name')],
                'email' => 'required|email|unique:users,email|max:255',
                'password' => 'required|string|min:8|max:255|regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/',
                'role_id' => ['required', 'integer', Rule::in(Role::whereIn('id', [1, 2])->pluck('id')->toArray())],
            ];

            // Validate input
            $validator = Validator::make($request->all(), $rules, [
                'password.regex' => 'The password must contain at least one uppercase letter, one digit, and one special character.',
                'email.unique' => 'This email address is already registered.',
                'gender.required' => 'Please select a gender.',
                'role_id.required' => 'Please select a role.',
                'first_name.required' => 'First name is required.',
                'last_name.required' => 'Last name is required.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Generate unique username
            $baseUsername = strtolower($request->first_name . '.' . $request->last_name);
            $username = $this->generateUniqueUsername($baseUsername);

            // Fetch gender and suffix
            $gender = Gender::where('gender_name', $request->gender)->first();
            if (!$gender) {
                return response()->json([
                    'status' => 'error',
                    'error' => 'Invalid gender selected',
                ], 422);
            }
            
            $suffix = null;
            if ($request->suffix) {
                $suffix = Suffix::where('suffix_name', $request->suffix)->first();
                if (!$suffix) {
                    return response()->json([
                        'status' => 'error',
                        'error' => 'Invalid suffix selected',
                    ], 422);
                }
            }

            // Create user
            $user = User::create([
                'username' => $username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $request->role_id,
                'created_at' => now(),
                'updated_at' => now(),
                'archived' => false,
            ]);

            // Create profile
            Profile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'middlename' => $request->middle_name,
                'last_name' => $request->last_name,
                'gender_id' => $gender->id,
                'suffix_id' => $suffix ? $suffix->id : null,
            ]);

            DB::commit();

            // Send welcome notification
            NotificationController::createNotification(
                $user->id,
                null,
                'welcome',
                'WORQO Job Portal - Welcome to WORQO',
                'Welcome to WORQO! We\'re excited to have you onboard. Complete your profile to get started. Complete your address: Click here'
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Registered successfully',
                'data' => [
                    'user_id' => $user->id,
                    'username' => $user->username,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Registration failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['password']), // Don't log password
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Registration failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during registration',
            ], 500);
        }
    }

    /**
     * Generate a unique username by appending a number if necessary.
     *
     * @param string $baseUsername
     * @return string
     */
    private function generateUniqueUsername(string $baseUsername): string
    {
        // Clean the base username to ensure it's valid
        $baseUsername = preg_replace('/[^a-z0-9.]/', '', strtolower($baseUsername));
        
        // Ensure it starts with a letter
        if (!preg_match('/^[a-z]/', $baseUsername)) {
            $baseUsername = 'user' . $baseUsername;
        }
        
        $username = $baseUsername;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
            
            // Prevent infinite loop
            if ($counter > 9999) {
                $username = $baseUsername . time();
                break;
            }
        }

        return $username;
    }

    /**
     * Get available roles for registration.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRoles()
    {
        $roles = Role::whereIn('id', [1, 2])->select('id', 'role_name')->get();
        return response()->json($roles, 200); // Return flat array for frontend compatibility
    }
}
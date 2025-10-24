<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                
                // Check if user is archived
                if ($user->archived == 1) {
                    Log::info('Login attempt for archived user:', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);
                    Auth::logout();
                    return response()->json(['message' => 'Account is archived and cannot log in'], 403);
                }

                // Update last_activity timestamp and set user as online when user logs in
                Log::info('Updating last_activity and is_online on login', [
                    'user_id' => $user->id,
                    'previous_activity' => $user->last_activity,
                    'new_activity' => now(),
                    'is_online' => 1
                ]);
                $user->last_activity = now();
                $user->is_online = 1;
                $user->save();

                Log::info('Authenticated User:', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'profile' => $user->profile ? $user->profile->toArray() : null,
                ]);

                if (!$user->profile) {
                    return response()->json(['message' => 'User profile not found'], 404);
                }

                $token = $user->createToken('authToken')->accessToken;
                
                // Load the complete user data with relationships
                $user->load(['role', 'profile.gender', 'profile.suffix']);
                
                return response()->json([
                    'token' => $token,
                    'user' => $this->formatUserResponse($user),
                ], 200);
            }

            return response()->json(['message' => 'Invalid email or password'], 401);
        } catch (\Exception $e) {
            Log::error('Error during login: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Login failed: ' . $e->getMessage()], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();
            if ($user) {
                // Update last_activity timestamp and set user as offline when user logs out
                Log::info('Updating last_activity and is_online on logout', [
                    'user_id' => $user->id,
                    'previous_activity' => $user->last_activity,
                    'new_activity' => now(),
                    'is_online' => 0
                ]);
                $user->last_activity = now();
                $user->is_online = 0;
                $user->save();
                
                // Revoke the current access token
                $user->tokens()->delete();
                Log::info('User logged out', ['user_id' => $user->id]);
                return response()->json(['message' => 'Successfully logged out'], 200);
            }
            
            // If no user is authenticated, still return success since they're effectively logged out
            Log::info('Logout called with no authenticated user');
            return response()->json(['message' => 'Successfully logged out'], 200);
        } catch (\Exception $e) {
            Log::error('Error during logout: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Logout failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper method to format user response.
     *
     * @param \App\Models\User $user
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
            'last_activity' => $user->last_activity,
            'is_online' => $user->is_online,
            'archived' => $user->archived,
        ];
    }
}
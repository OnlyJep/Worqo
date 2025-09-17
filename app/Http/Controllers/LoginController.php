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

                Log::info('Authenticated User:', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'profile' => $user->profile ? $user->profile->toArray() : null,
                ]);

                if (!$user->profile) {
                    return response()->json(['message' => 'User profile not found'], 404);
                }

                $token = $user->createToken('authToken')->accessToken;
                return response()->json([
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role_id' => $user->role_id,
                        'first_name' => $user->profile->first_name,
                        'middlename' => $user->profile->middlename,
                        'last_name' => $user->profile->last_name,
                        'gender_id' => $user->profile->gender_id,
                        'suffix_id' => $user->profile->suffix_id,
                        'contact_number' => $user->profile->contact_number,
                        'street' => $user->profile->street,
                        'city' => $user->profile->city,
                        'province' => $user->profile->province,
                        'postal_code' => $user->profile->postal_code,
                        'country' => $user->profile->country,
                        'profile_img' => $user->profile->profile_img ? asset('storage/' . $user->profile->profile_img) : null,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ],
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
                $request->user()->token()->revoke();
                Log::info('User logged out', ['user_id' => $user->id]);
                return response()->json(['message' => 'Successfully logged out'], 200);
            }
            return response()->json(['message' => 'No user authenticated'], 401);
        } catch (\Exception $e) {
            Log::error('Error during logout: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Logout failed: ' . $e->getMessage()], 500);
        }
    }
}
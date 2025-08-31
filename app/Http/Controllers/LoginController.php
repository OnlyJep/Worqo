<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            \Log::info('Authenticated User:', ['user' => $user->toArray(), 'profile' => $user->profile ? $user->profile->toArray() : null]);

            // Check if profile exists
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
                    'profile_img' => $user->profile->profile_img,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
            ], 200);
        }

        return response()->json(['message' => 'Invalid email or password'], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->token()->revoke();
        return response()->json(['message' => 'Successfully logged out'], 200);
    }
}
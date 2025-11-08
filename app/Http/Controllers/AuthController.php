<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        
        // Set user as online and update last activity
        $updateData = ['is_online' => 1];
        
        // Only update last_activity if the column exists
        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_activity')) {
            $updateData['last_activity'] = now();
        }
        
        $user->update($updateData);
        
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 200);
    }

    public function logout()
    {
        $user = Auth::user();
        
        // Set user as offline
        if ($user) {
            $user->update([
                'is_online' => 0
            ]);
        }
        
        Auth::logout();
        return response()->json(['message' => 'Logged out successfully']);
    }
}

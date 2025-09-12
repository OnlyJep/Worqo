<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Profile;

class ProfileController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'gender_id' => 'required|exists:genders,id',
        ]);
    
        $profile = Profile::create($request->all());
    
        return response()->json(['message' => 'Profile created successfully', 'profile' => $profile], 201);
    }

    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        
        if (!$userId) {
            return response()->json(['message' => 'user_id is required'], 400);
        }

        $profile = Profile::where('user_id', $userId)->first();

        if (!$profile) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        return response()->json($profile, 200);
    }
}
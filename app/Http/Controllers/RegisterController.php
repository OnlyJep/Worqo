<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Gender;
use App\Models\Role;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        DB::beginTransaction();
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'gender' => 'required|exists:genders,gender_name',
                'suffix' => 'nullable|exists:suffixes,suffix_name',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|regex:/^(?=.*[A-Z])(?=.*\d).+$/',
                'role_id' => 'required|integer|in:1,2',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            // Fetch gender
            $gender = Gender::where('gender_name', $request->gender)->first();
            if (!$gender) {
                return response()->json(['error' => 'Invalid gender selection'], 400);
            }

            // Fetch suffix (if provided)
            $suffix = $request->suffix ? DB::table('suffixes')->where('suffix_name', $request->suffix)->first() : null;

            // Create user
            $user = User::create([
                'username' => strtolower($request->first_name . '.' . $request->last_name),
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
                'contact_number' => null,
                'street' => null,
                'city' => null,
                'province' => null,
                'postal_code' => null,
                'country' => null,
                'profile_img' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json(['message' => 'Registered Successfully'], 201);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Registration failed: ' . $e->getMessage(), ['trace' => $e->getTrace()]);
            return response()->json([
                'error' => 'Registration failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getRoles()
    {
        $roles = Role::whereIn('id', [1, 2])->get(['id', 'role_name']);
        return response()->json($roles, 200);
    }
}
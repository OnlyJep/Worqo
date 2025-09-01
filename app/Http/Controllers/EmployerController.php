<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use App\Models\Employer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployerController extends Controller
{
    // List active employers
    public function index()
    {
        try {
            $employers = User::with(['profile', 'employer'])
                ->where('role_id', 2)
                ->where('archived', false)
                ->get();

            foreach ($employers as $user) {
                if (!$user->employer && $user->profile) {
                    Employer::updateOrCreate(
                        ['profile_id' => $user->profile->id],
                        [
                            'company_name'    => 'N/A',
                            'company_phone'   => null,
                            'company_email'   => $user->email,
                            'company_address' => 'N/A',
                        ]
                    );
                }
            }

            $employers = User::with(['profile', 'employer'])
                ->where('role_id', 2)
                ->where('archived', false)
                ->get();

            return response()->json($employers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch employers'], 500);
        }
    }

    // List archived employers
    public function archived()
    {
        try {
            $employers = User::with(['profile', 'employer'])
                ->where('role_id', 2)
                ->where('archived', true)
                ->get();

            foreach ($employers as $user) {
                if (!$user->employer && $user->profile) {
                    Employer::updateOrCreate(
                        ['profile_id' => $user->profile->id],
                        [
                            'company_name'    => 'N/A',
                            'company_phone'   => null,
                            'company_email'   => $user->email,
                            'company_address' => 'N/A',
                        ]
                    );
                }
            }

            $employers = User::with(['profile', 'employer'])
                ->where('role_id', 2)
                ->where('archived', true)
                ->get();

            return response()->json($employers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch archived employers'], 500);
        }
    }

    // Show employer details
    public function show($id)
    {
        try {
            $employer = User::with(['profile', 'employer'])->findOrFail($id);

            if (!$employer->employer && $employer->profile) {
                Employer::updateOrCreate(
                    ['profile_id' => $employer->profile->id],
                    [
                        'company_name'    => 'N/A',
                        'company_phone'   => null,
                        'company_email'   => $employer->email,
                        'company_address' => 'N/A',
                    ]
                );
                $employer = User::with(['profile', 'employer'])->findOrFail($id);
            }

            return response()->json($employer);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Employer not found'], 404);
        }
    }

    // Store new employer
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_name'   => 'required|string|max:255',
                'company_email'  => 'required|email|max:255',
                'company_phone'  => 'nullable|string|regex:/^\d{10,15}$/',
                'company_address' => 'nullable|string|max:255',
                'email'          => 'required|email|unique:users,email',
                'password'       => 'required|min:6',
                'first_name'     => 'required|string|max:255',
                'last_name'      => 'required|string|max:255',
                'contact_number' => 'nullable|string|regex:/^\d{10,15}$/',
                'street'         => 'nullable|string|max:255',
                'middlename'     => 'nullable|string|max:255',
                'suffix_id'      => 'nullable|exists:suffixes,id',
                'gender_id'      => 'nullable|exists:genders,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = User::create([
                'username'   => $request->username ?? strtolower($request->first_name . '.' . $request->last_name),
                'email'      => $request->email,
                'password'   => Hash::make($request->password),
                'role_id'    => 2,
                'archived'   => false,
            ]);

            $profile = Profile::create([
                'user_id'        => $user->id,
                'first_name'     => $request->first_name,
                'middlename'     => $request->middlename,
                'last_name'      => $request->last_name,
                'suffix_id'      => $request->suffix_id,
                'gender_id'      => $request->gender_id,
                'contact_number' => $request->contact_number,
                'street'         => $request->street,
                'city'           => $request->city ?? 'Butuan City',
                'province'       => $request->province ?? 'Agusan Del Norte',
                'postal_code'    => $request->postal_code ?? '8600',
                'country'        => $request->country ?? 'Philippines',
                'profile_img'    => $request->hasFile('profile_img')
                                    ? $request->file('profile_img')->store('profiles', 'public')
                                    : null,
            ]);

            $employer = Employer::create([
                'profile_id'      => $profile->id,
                'company_name'    => $request->company_name,
                'company_phone'   => $request->company_phone,
                'company_email'   => $request->company_email,
                'company_address' => $request->company_address,
            ]);

            return response()->json([
                'message'  => 'Employer created successfully',
                'employer' => $user->load(['profile', 'employer'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create employer'], 500);
        }
    }

    // Update employer
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'company_name'   => 'required|string|max:255',
                'company_email'  => ['required', 'email', 'max:255', Rule::unique('employers', 'company_email')->ignore($user->employer->id)],
                'company_phone'  => 'nullable|string|regex:/^\d{10,15}$/',
                'company_address' => 'nullable|string|max:255',
                'email'          => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
                'password'       => 'nullable|min:6',
                'first_name'     => 'required|string|max:255',
                'last_name'      => 'required|string|max:255',
                'contact_number' => 'nullable|string|regex:/^\d{10,15}$/',
                'street'         => 'nullable|string|max:255',
                'middlename'     => 'nullable|string|max:255',
                'suffix_id'      => 'nullable|exists:suffixes,id',
                'gender_id'      => 'nullable|exists:genders,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user->update([
                'email'    => $request->email,
                'username' => $request->username ?? $user->username,
                'password' => $request->password ? Hash::make($request->password) : $user->password,
            ]);

            $user->profile->update([
                'first_name'     => $request->first_name,
                'middlename'     => $request->middlename,
                'last_name'      => $request->last_name,
                'suffix_id'      => $request->suffix_id,
                'gender_id'      => $request->gender_id,
                'contact_number' => $request->contact_number,
                'street'         => $request->street,
                'city'           => $request->city ?? $user->profile->city,
                'province'       => $request->province ?? $user->profile->province,
                'postal_code'    => $request->postal_code ?? $user->profile->postal_code,
                'country'        => $request->country ?? $user->profile->country,
                'profile_img'    => $request->hasFile('profile_img')
                                    ? $request->file('profile_img')->store('profiles', 'public')
                                    : $user->profile->profile_img,
            ]);

            $employer = Employer::updateOrCreate(
                ['profile_id' => $user->profile->id],
                [
                    'company_name'    => $request->company_name,
                    'company_phone'   => $request->company_phone,
                    'company_email'   => $request->company_email,
                    'company_address' => $request->company_address,
                ]
            );

            return response()->json([
                'message'  => 'Employer updated successfully',
                'employer' => $user->load(['profile', 'employer'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update employer: ' . $e->getMessage()], 500);
        }
    }

    // Archive employer
    public function archive($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->archived = true;
            $user->save();

            return response()->json(['message' => 'Employer archived successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to archive employer'], 500);
        }
    }

    // Restore employer
    public function restore($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->archived = false;
            $user->save();

            return response()->json(['message' => 'Employer restored successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to restore employer'], 500);
        }
    }
}
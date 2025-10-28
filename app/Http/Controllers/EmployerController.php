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
                            'user_id' => $user->id,
                            'full_name' => $user->profile->first_name . ' ' . $user->profile->last_name,
                            'gender_id' => $user->profile->gender_id,
                            'suffix_id' => $user->profile->suffix_id,
                            'street' => $user->profile->street ?? 'N/A',
                            'city' => $user->profile->city ?? 'N/A',
                            'province' => $user->profile->province ?? 'N/A',
                            'postal_code' => $user->profile->postal_code ?? 'N/A',
                            'country' => $user->profile->country ?? 'N/A',
                            'credentials_name' => [],
                            'credentials_photo' => [],
                            'credentials_doc' => [],
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
            return response()->json(['error' => 'Failed to fetch employers: ' . $e->getMessage()], 500);
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
                            'user_id' => $user->id,
                            'full_name' => $user->profile->first_name . ' ' . $user->profile->last_name,
                            'gender_id' => $user->profile->gender_id,
                            'suffix_id' => $user->profile->suffix_id,
                            'street' => $user->profile->street ?? 'N/A',
                            'city' => $user->profile->city ?? 'N/A',
                            'province' => $user->profile->province ?? 'N/A',
                            'postal_code' => $user->profile->postal_code ?? 'N/A',
                            'country' => $user->profile->country ?? 'N/A',
                            'credentials_name' => [],
                            'credentials_photo' => [],
                            'credentials_doc' => [],
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
            return response()->json(['error' => 'Failed to fetch archived employers: ' . $e->getMessage()], 500);
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
                        'user_id' => $employer->id,
                        'full_name' => $employer->profile->first_name . ' ' . $employer->profile->last_name,
                        'gender_id' => $employer->profile->gender_id,
                        'suffix_id' => $employer->profile->suffix_id,
                        'street' => $employer->profile->street ?? 'N/A',
                        'city' => $employer->profile->city ?? 'N/A',
                        'province' => $employer->profile->province ?? 'N/A',
                        'postal_code' => $employer->profile->postal_code ?? 'N/A',
                        'country' => $employer->profile->country ?? 'N/A',
                        'credentials_name' => [],
                        'credentials_photo' => [],
                        'credentials_doc' => [],
                    ]
                );
                $employer = User::with(['profile', 'employer'])->findOrFail($id);
            }

            return response()->json(['employer' => $employer]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Employer not found: ' . $e->getMessage()], 404);
        }
    }

    // Store new employer
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
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
                'user_id'         => $user->id,
                'full_name'       => $request->first_name . ' ' . $request->last_name,
                'gender_id'       => $request->gender_id,
                'suffix_id'       => $request->suffix_id,
                'street'          => $request->street,
                'city'            => $request->city ?? 'Butuan City',
                'province'        => $request->province ?? 'Agusan Del Norte',
                'postal_code'     => $request->postal_code ?? '8600',
                'country'         => $request->country ?? 'Philippines',
                'credentials_name' => [],
                'credentials_photo' => [],
                'credentials_doc' => [],
            ]);

            return response()->json([
                'message'  => 'Employer created successfully',
                'employer' => $user->load(['profile', 'employer'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create employer: ' . $e->getMessage()], 500);
        }
    }

    // Update employer
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
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
                    'user_id'     => $user->id,
                    'full_name'   => $request->first_name . ' ' . $request->last_name,
                    'gender_id'   => $request->gender_id,
                    'suffix_id'   => $request->suffix_id,
                    'street'      => $request->street,
                    'city'        => $request->city ?? $user->profile->city,
                    'province'    => $request->province ?? $user->profile->province,
                    'postal_code' => $request->postal_code ?? $user->profile->postal_code,
                    'country'     => $request->country ?? $user->profile->country,
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

    // Update employer credentials
    public function updateCredentials(Request $request, $id)
    {
        try {
            // Validate credentials
            $request->validate([
                'credentials.*.credentials_name' => 'required|string',
                'credentials.*.credentials_photo' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:2048',
                'credentials.*.credentials_doc' => 'nullable|file|mimes:pdf,doc,docx|max:2048',
            ]);
            
            $user = User::findOrFail($id);
            
            // Ensure user is an employer
            if ($user->role_id !== 2) {
                return response()->json(['error' => 'User is not an employer'], 403);
            }

            // Get or create employer record
            $employer = Employer::where('user_id', $user->id)->first();
            
            if (!$employer) {
                // Create employer record if it doesn't exist
                $profile = $user->profile;
                if (!$profile) {
                    return response()->json(['error' => 'User profile not found'], 404);
                }
                
                $employer = Employer::create([
                    'profile_id' => $profile->id,
                    'user_id' => $user->id,
                    'full_name' => ($profile->first_name ?? '') . ' ' . ($profile->last_name ?? ''),
                    'gender_id' => $profile->gender_id ?? 1,
                    'suffix_id' => $profile->suffix_id,
                    'street' => $profile->street ?? 'N/A',
                    'city' => $profile->city ?? 'Butuan City',
                    'province' => $profile->province ?? 'Agusan Del Norte',
                    'postal_code' => $profile->postal_code ?? '8600',
                    'country' => $profile->country ?? 'Philippines',
                    'credentials_name' => [],
                    'credentials_photo' => [],
                    'credentials_doc' => [],
                ]);
            }

            // Process credentials
            $credentialsNames = [];
            $credentialsPhotos = [];
            $credentialsDocs = [];

            if ($request->has('credentials')) {
                $credentials = $request->input('credentials');
                
                if (is_string($credentials)) {
                    $credentials = json_decode($credentials, true);
                }
                
                if (is_array($credentials)) {
                    foreach ($credentials as $index => $credential) {
                        if (isset($credential['credentials_name']) && !empty($credential['credentials_name'])) {
                            $credentialsNames[] = $credential['credentials_name'];
                            
                            // Handle credentials_photo file upload
                            if ($request->hasFile("credentials.{$index}.credentials_photo")) {
                                $file = $request->file("credentials.{$index}.credentials_photo");
                                $filename = time() . '_' . $index . '_photo_' . $file->getClientOriginalName();
                                $path = $file->storeAs('employer_credentials', $filename, 'public');
                                $credentialsPhotos[] = $path;
                            } elseif (isset($credential['existing_photo']) && !empty($credential['existing_photo'])) {
                                $credentialsPhotos[] = $credential['existing_photo'];
                            } else {
                                $credentialsPhotos[] = null;
                            }
                            
                            // Handle credentials_doc file upload
                            if ($request->hasFile("credentials.{$index}.credentials_doc")) {
                                $file = $request->file("credentials.{$index}.credentials_doc");
                                $filename = time() . '_' . $index . '_doc_' . $file->getClientOriginalName();
                                $path = $file->storeAs('employer_credentials', $filename, 'public');
                                $credentialsDocs[] = $path;
                            } elseif (isset($credential['existing_doc']) && !empty($credential['existing_doc'])) {
                                $credentialsDocs[] = $credential['existing_doc'];
                            } else {
                                $credentialsDocs[] = null;
                            }
                        }
                    }
                }
            }

            // Update employer credentials
            $employer->update([
                'credentials_name' => $credentialsNames,
                'credentials_photo' => $credentialsPhotos,
                'credentials_doc' => $credentialsDocs,
            ]);

            return response()->json([
                'message' => 'Employer credentials updated successfully',
                'employer' => $employer->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update employer credentials: ' . $e->getMessage()], 500);
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
            return response()->json(['error' => 'Failed to archive employer: ' . $e->getMessage()], 500);
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
            return response()->json(['error' => 'Failed to restore employer: ' . $e->getMessage()], 500);
        }
    }
}
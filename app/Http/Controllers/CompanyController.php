<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Profile;
use App\Models\User;
use App\Models\Suffix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CompanyController extends Controller
{
    public function __construct()
    {
        Log::info('Loaded CompanyController.php version: 2025-09-03');
    }

    public function index(Request $request)
    {
        $perPage = $request->query('limit', 5);
        $search = $request->query('search', '');

        $query = Company::where('archived', false);
        if ($search) {
            $query->where('company_name', 'like', '%' . $search . '%');
        }

        $companies = $query->paginate($perPage);
        $companies = $this->enrichCompanies($companies);

        return response()->json([
            'companies' => $companies->getCollection(),
            'pagination' => [
                'currentPage' => $companies->currentPage(),
                'totalPages' => $companies->lastPage(),
                'totalItems' => $companies->total(),
            ],
        ], 200);
    }

    public function archived(Request $request)
    {
        $perPage = $request->query('limit', 5);
        $search = $request->query('search', '');

        $query = Company::where('archived', true);
        if ($search) {
            $query->where('company_name', 'like', '%' . $search . '%');
        }

        $companies = $query->paginate($perPage);
        $companies = $this->enrichCompanies($companies);

        return response()->json([
            'companies' => $companies->getCollection(),
            'pagination' => [
                'currentPage' => $companies->currentPage(),
                'totalPages' => $companies->lastPage(),
                'totalItems' => $companies->total(),
            ],
        ], 200);
    }

    public function store(Request $request)
    {
        // Log request input for debugging
        Log::info('Store request input:', $request->all());

        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'employer_id' => 'required|integer|exists:users,id',
            'worker_ids' => 'nullable|array',
            'worker_ids.*' => 'integer|exists:users,id',
            'street' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20|regex:/^\+?[\d\s-]{7,20}$/',
            'city' => 'required|string|in:Butuan City',
            'province' => 'required|string|in:Agusan Del Norte',
            'postal_code' => 'required|integer|in:8600',
            'country' => 'required|string|in:Philippines',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employerId = $request->input('employer_id');
        $workerIds = $request->input('worker_ids', []);

        $employer = User::where('id', $employerId)->where('role_id', 2)->first();
        if (!$employer) {
            Log::error('Invalid employer: role_id != 2', ['employer_id' => $employerId]);
            return response()->json(['error' => 'Employer must have role_id = 2 (CEO)'], 422);
        }

        if (!empty($workerIds)) {
            $workers = User::whereIn('id', $workerIds)->where('role_id', 1)->get();
            if ($workers->count() !== count($workerIds)) {
                Log::error('Invalid workers: not all have role_id = 1', ['worker_ids' => $workerIds]);
                return response()->json(['error' => 'All worker IDs must have role_id = 1'], 422);
            }
        }

        $profileIds = array_merge([$employerId], $workerIds);

        // Explicitly set data for Company::create to avoid missing fields
        $data = [
            'company_name' => $request->input('company_name'),
            'profile_id' => json_encode($profileIds), // Ensure JSON encoding for longtext
            'street' => $request->input('street'),
            'contact_number' => $request->input('contact_number'),
            'city' => $request->input('city', 'Butuan City'),
            'province' => $request->input('province', 'Agusan Del Norte'),
            'postal_code' => (int)$request->input('postal_code', 8600), // Cast to int
            'country' => $request->input('country', 'Philippines'),
        ];

        Log::info('Data prepared for Company::create:', $data);

        $company = Company::create($data);

        Log::info('Company created:', [
            'company_id' => $company->id,
            'city' => $company->city,
            'province' => $company->province,
            'postal_code' => $company->postal_code,
            'country' => $company->country,
        ]);

        return response()->json(['company' => $this->enrichCompany($company)], 201);
    }

    public function show($id)
    {
        $company = Company::where('archived', false)->findOrFail($id);
        $company = $this->enrichCompany($company);
        return response()->json(['company' => $company], 200);
    }

public function update(Request $request, $id)
{
    try {
        $company = Company::where('archived', false)->findOrFail($id);

        // Log request input for debugging
        Log::info('Update request input:', $request->all());

        $validator = Validator::make($request->all(), [
            'company_name' => 'sometimes|string|max:255',
            'employer_id' => 'sometimes|integer|exists:users,id',
            'worker_ids' => 'nullable|array',
            'worker_ids.*' => 'integer|exists:users,id',
            'street' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20|regex:/^\+?[\d\s-]{7,20}$/',
            'city' => 'required|string|in:Butuan City',
            'province' => 'required|string|in:Agusan Del Norte',
            'postal_code' => 'required|integer|in:8600',
            'country' => 'required|string|in:Philippines',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('employer_id')) {
            $employerId = $request->input('employer_id');
            $employer = User::where('id', $employerId)->where('role_id', 2)->first();
            if (!$employer) {
                Log::error('Invalid employer: role_id != 2', ['employer_id' => $employerId]);
                return response()->json(['error' => 'Employer must have role_id = 2 (CEO)'], 422);
            }
        }

        if ($request->has('worker_ids')) {
            $workerIds = $request->input('worker_ids', []);
            if (!empty($workerIds)) {
                $workers = User::whereIn('id', $workerIds)->where('role_id', 1)->get();
                if ($workers->count() !== count($workerIds)) {
                    Log::error('Invalid workers: not all have role_id = 1', ['worker_ids' => $workerIds]);
                    return response()->json(['error' => 'All worker IDs must have role_id = 1'], 422);
                }
            }
        }

        $data = [
            'company_name' => $request->input('company_name', $company->company_name),
            'street' => $request->input('street', $company->street),
            'contact_number' => $request->input('contact_number', $company->contact_number),
            'city' => $request->input('city', 'Butuan City'),
            'province' => $request->input('province', 'Agusan Del Norte'),
            'postal_code' => (int)$request->input('postal_code', 8600),
            'country' => $request->input('country', 'Philippines'),
        ];

        if ($request->has('employer_id') || $request->has('worker_ids')) {
            // Use existing profile_id if not updating employer_id or worker_ids
            $existingProfileIds = is_string($company->profile_id) ? json_decode($company->profile_id, true) : ($company->profile_id ?? []);
            $employerId = $request->input('employer_id', $existingProfileIds[0] ?? null);
            $workerIds = $request->input('worker_ids', array_slice($existingProfileIds, 1));
            $data['profile_id'] = json_encode(array_merge([$employerId], $workerIds));
        }

        Log::info('Data prepared for Company::update:', $data);

        $company->update($data);

        Log::info('Company updated:', [
            'company_id' => $company->id,
            'city' => $company->city,
            'province' => $company->province,
            'postal_code' => $company->postal_code,
            'country' => $company->country,
        ]);

        return response()->json(['company' => $this->enrichCompany($company)], 200);
    } catch (\Exception $e) {
        Log::error('Error updating company:', [
            'company_id' => $id,
            'error_message' => $e->getMessage(),
            'stack_trace' => $e->getTraceAsString(),
        ]);
        return response()->json(['error' => 'An error occurred while updating the company.'], 500);
    }
}
    public function archive(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        $archived = $request->input('archived', true);
        $company->update(['archived' => $archived]);
        return response()->json(['message' => $archived ? 'Company archived' : 'Company restored'], 200);
    }

    public function bulkArchive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_ids' => 'required|array',
            'company_ids.*' => 'integer|exists:companies,id',
            'archived' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            Log::error('Bulk archive validation failed:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $companyIds = $request->input('company_ids');
        $archived = $request->input('archived');
        Company::whereIn('id', $companyIds)->update(['archived' => $archived]);

        return response()->json(['message' => $archived ? 'Companies archived' : 'Companies restored'], 200);
    }

    private function enrichCompany($company)
    {
        $profileIds = is_string($company->profile_id) ? json_decode($company->profile_id, true) : ($company->profile_id ?? []);
        $profiles = Profile::whereIn('id', $profileIds)->with('user')->get();
        $suffixes = Suffix::all()->pluck('name', 'id')->toArray();

        $ceo = null;
        $workers = [];
        foreach ($profiles as $profile) {
            $profileData = [
                'id' => $profile->id,
                'user_id' => $profile->user_id,
                'first_name' => $profile->first_name ?? 'Unknown',
                'middlename' => $profile->middlename,
                'last_name' => $profile->last_name ?? 'Unknown',
                'suffix' => $profile->suffix_id ? ($suffixes[$profile->suffix_id] ?? null) : null,
                'gender_id' => $profile->gender_id,
                'suffix_id' => $profile->suffix_id,
                'contact_number' => $profile->contact_number,
                'street' => $profile->street,
                'city' => $profile->city,
                'province' => $profile->province,
                'postal_code' => $profile->postal_code,
                'country' => $profile->country,
                'profile_img' => $profile->profile_img,
            ];

            if ($profile->user && $profile->user->role_id == 2) {
                $ceo = $profileData;
            } else {
                $profileData['skills'] = []; // Add skills fetching logic if needed
                $workers[] = $profileData;
            }
        }

        return [
            'id' => $company->id,
            'company_name' => $company->company_name ?? 'Unnamed Company',
            'employer_id' => $ceo ? $ceo['user_id'] : null,
            'worker_ids' => array_column($workers, 'user_id'),
            'street' => $company->street,
            'contact_number' => $company->contact_number,
            'city' => $company->city,
            'province' => $company->province,
            'postal_code' => $company->postal_code,
            'country' => $company->country,
            'created_at' => $company->created_at,
            'updated_at' => $company->updated_at,
            'archived' => $company->archived,
            'employer' => $ceo,
            'workers' => $workers,
        ];
    }

    private function enrichCompanies($companies)
    {
        $companies->setCollection(
            $companies->getCollection()->map(function ($company) {
                return $this->enrichCompany($company);
            })
        );
        return $companies;
    }
}
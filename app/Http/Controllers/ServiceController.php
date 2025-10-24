<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ServiceController extends Controller
{
public function index(Request $request)
{
    try {
        $perPage = $request->query('limit', 5);
        $page = $request->query('page', 1);
        $search = $request->query('search');
        $colorCollarId = $request->query('color_collar_id');
        $archived = filter_var($request->query('archived', false), FILTER_VALIDATE_BOOLEAN);

        $query = Service::with('collar');

        // Apply search filter only if search term is provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply color collar filter
        if (!empty($colorCollarId)) {
            $query->where('collars_id', $colorCollarId);
        }

        // Apply archived filter
        $query->when($archived, function ($q) {
            return $q->where('archived', true);
        }, function ($q) {
            return $q->where('archived', false);
        });

        $services = $query->paginate($perPage, ['*'], 'page', $page);

        $formattedServices = collect($services->items())->map(function ($service) {
            // Decode skills_id (stored as JSON in the database)
            $skillIds = json_decode($service->skills_id, true) ?? [];
            $skills = Skill::whereIn('id', $skillIds)->get()->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                ];
            })->toArray();

            return [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'color_collar_id' => $service->collars_id,
                'color_collar_name' => $service->collar ? $service->collar->name : null,
                'collar_img' => $service->collar ? $service->collar->collar_img : null,
                'skill_ids' => array_map('strval', $skillIds),
                'skills' => $skills,
                'service_image' => $service->service_img,
                'created_at' => $service->created_at,
                'updated_at' => $service->updated_at,
            ];
        });

        return response()->json([
            'services' => $formattedServices,
            'pagination' => [
                'currentPage' => $services->currentPage(),
                'totalPages' => $services->lastPage(),
            ],
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error fetching services: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
        return response()->json(['error' => 'Failed to fetch services', 'details' => $e->getMessage()], 500);
    }
}
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_collar_id' => 'required|exists:collars,id',
            'skill_ids' => 'required|array|min:1',
            'skill_ids.*' => 'exists:skills,id',
            'service_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = [
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'collars_id' => $request->input('color_collar_id'),
                'skills_id' => json_encode($request->input('skill_ids', [])),
                'archived' => false,
            ];

            if ($request->hasFile('service_image')) {
                $path = $request->file('service_image')->store('serviceimg', 'public');
                $data['service_img'] = $path;
            }

            $service = Service::create($data);

            $skillIds = $request->input('skill_ids', []);
            $skills = Skill::whereIn('id', $skillIds)->get()->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                ];
            })->toArray();

            return response()->json([
                'message' => 'Service created successfully',
                'service' => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'color_collar_id' => $service->collars_id,
                    'color_collar_name' => $service->collar ? $service->collar->name : null,
                    'skill_ids' => array_map('strval', $skillIds),
                    'skills' => $skills,
                    'service_image' => $service->service_img,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating service: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Failed to create service', 'details' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_collar_id' => 'required|exists:collars,id',
            'skill_ids' => 'required|array|min:1',
            'skill_ids.*' => 'exists:skills,id',
            'service_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = [
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'collars_id' => $request->input('color_collar_id'),
                'skills_id' => json_encode($request->input('skill_ids', [])),
            ];

            if ($request->hasFile('service_image')) {
                if ($service->service_img) {
                    Storage::disk('public')->delete($service->service_img);
                }
                $path = $request->file('service_image')->store('serviceimg', 'public');
                $data['service_img'] = $path;
            } elseif ($request->input('service_image') === '') {
                if ($service->service_img) {
                    Storage::disk('public')->delete($service->service_img);
                }
                $data['service_img'] = null;
            }

            $service->update($data);

            $skillIds = $request->input('skill_ids', []);
            $skills = Skill::whereIn('id', $skillIds)->get()->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                ];
            })->toArray();

            return response()->json([
                'message' => 'Service updated successfully',
                'service' => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'color_collar_id' => $service->collars_id,
                    'color_collar_name' => $service->collar ? $service->collar->name : null,
                    'skill_ids' => array_map('strval', $skillIds),
                    'skills' => $skills,
                    'service_image' => $service->service_img,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating service: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Failed to update service', 'details' => $e->getMessage()], 500);
        }
    }

    public function archive(Request $request, $id)
    {
        try {
            $service = Service::findOrFail($id);
            $service->update(['archived' => $request->input('archived', true)]);

            return response()->json([
                'message' => $service->archived ? 'Service archived successfully' : 'Service restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving/restoring service: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Failed to archive/restore service', 'details' => $e->getMessage()], 500);
        }
    }

    public function bulkArchive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_ids' => 'required|array',
            'service_ids.*' => 'exists:services,id',
            'action' => 'required|in:archive,restore',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $archived = $request->input('action') === 'archive';
            Service::whereIn('id', $request->input('service_ids'))->update(['archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Services archived successfully' : 'Services restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error bulk archiving/restoring services: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Failed to bulk archive/restore services', 'details' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $service = Service::with('collar')->findOrFail($id);

            $skillIds = $service->skills_id ?? [];
            $skills = Skill::whereIn('id', $skillIds)->get()->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                ];
            })->toArray();

            return response()->json([
                'service' => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'color_collar_id' => $service->collars_id,
                    'color_collar_name' => $service->collar ? $service->collar->name : null,
                    'collar_img' => $service->collar ? $service->collar->collar_img : null,
                    'skill_ids' => array_map('strval', $skillIds),
                    'skills' => $skills,
                    'service_image' => $service->service_img,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching service: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Service not found', 'details' => $e->getMessage()], 404);
        }
    }
}
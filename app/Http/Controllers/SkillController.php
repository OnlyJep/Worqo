<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SkillController extends Controller
{
    public function index()
    {
        try {
            $skills = Skill::active()->get(['id', 'skill_name', 'sub_skills', 'created_at', 'updated_at']);
            Log::info('Active Skills Raw:', $skills->toArray());
            
            // Pre-load all services with collars to avoid N+1 queries
            // Use try-catch to handle cases where Service or collar relationship might not exist
            try {
                $services = Service::with('collar')->whereNotNull('skills_id')->get();
            } catch (\Exception $e) {
                Log::warning('Error loading services for skills: ' . $e->getMessage());
                $services = collect([]);
            }
            
            $skills = $skills->map(function ($skill) use ($services) {
                // Find services that use this skill and get the collar
                $collarName = null;
                try {
                    foreach ($services as $service) {
                        $skillIds = json_decode($service->skills_id, true) ?? [];
                        if (in_array($skill->id, $skillIds)) {
                            if ($service->collar) {
                                $collarName = $service->collar->name;
                                break; // Use the first matching collar
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Error processing service for skill ' . $skill->id . ': ' . $e->getMessage());
                }
                
                return [
                    'id' => $skill->id,
                    'name' => $skill->skill_name,
                    'sub_skills' => $skill->sub_skills ?? [],
                    'collar' => $collarName,
                    'created_at' => $skill->created_at,
                    'updated_at' => $skill->updated_at,
                ];
            });
            return response()->json($skills, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching skills: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json(['error' => 'Failed to fetch skills', 'details' => $e->getMessage()], 500);
        }
    }

    public function archived()
    {
        $skills = Skill::archived()->get(['id', 'skill_name', 'sub_skills', 'created_at', 'updated_at']);
        Log::info('Archived Skills Raw:', $skills->toArray());
        
        // Pre-load all services with collars to avoid N+1 queries
        $services = Service::with('collar')->whereNotNull('skills_id')->get();
        
        $skills = $skills->map(function ($skill) use ($services) {
            // Find services that use this skill and get the collar
            $collarName = null;
            foreach ($services as $service) {
                $skillIds = json_decode($service->skills_id, true) ?? [];
                if (in_array($skill->id, $skillIds)) {
                    if ($service->collar) {
                        $collarName = $service->collar->name;
                        break; // Use the first matching collar
                    }
                }
            }
            
            return [
                'id' => $skill->id,
                'name' => $skill->skill_name,
                'sub_skills' => $skill->sub_skills ?? [],
                'collar' => $collarName,
                'created_at' => $skill->created_at,
                'updated_at' => $skill->updated_at,
            ];
        });
        return response()->json($skills, 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:skills,skill_name',
            'sub_skills' => 'nullable|array',
            'sub_skills.*' => 'string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $skillData = [
            'skill_name' => $request->name,
            'sub_skills' => $request->sub_skills ?? [],
        ];
        
        // Only add archived if column exists
        if (\Illuminate\Support\Facades\Schema::hasColumn('skills', 'archived')) {
            $skillData['archived'] = false;
        }
        
        $skill = Skill::create($skillData);

        return response()->json([
            'id' => $skill->id,
            'name' => $skill->skill_name,
            'sub_skills' => $skill->sub_skills ?? [],
            'created_at' => $skill->created_at,
            'updated_at' => $skill->updated_at,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:skills,skill_name,' . $id,
            'sub_skills' => 'nullable|array',
            'sub_skills.*' => 'string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $skill->update([
            'skill_name' => $request->name,
            'sub_skills' => $request->sub_skills ?? [],
        ]);

        return response()->json([
            'id' => $skill->id,
            'name' => $skill->skill_name,
            'sub_skills' => $skill->sub_skills ?? [],
            'created_at' => $skill->created_at,
            'updated_at' => $skill->updated_at,
        ], 200);
    }

    public function archive(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'archived' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $updateData = [];
        
        // Only update archived if column exists
        if (\Illuminate\Support\Facades\Schema::hasColumn('skills', 'archived')) {
            $updateData['archived'] = $request->archived;
        }
        
        if (!empty($updateData)) {
            $skill->update($updateData);
        }

        return response()->json([
            'message' => 'Skill archive status updated successfully',
        ], 200);
    }
}
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
        $skills = Skill::active()->get(['id', 'skill_name', 'sub_skills', 'created_at', 'updated_at']);
        Log::info('Active Skills Raw:', $skills->toArray());
        
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

        $skill = Skill::create([
            'skill_name' => $request->name,
            'sub_skills' => $request->sub_skills ?? [],
            'archived' => false,
        ]);

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

        $skill->update([
            'archived' => $request->archived,
        ]);

        return response()->json([
            'message' => 'Skill archive status updated successfully',
        ], 200);
    }
}
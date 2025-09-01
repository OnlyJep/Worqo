<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SkillController extends Controller
{
    public function index()
    {
        $skills = Skill::active()->get(['id', 'skill_name', 'created_at', 'updated_at']);
        Log::info('Active Skills Raw:', $skills->toArray()); // Debug raw data
        $skills = $skills->map(function ($skill) {
            return [
                'id' => $skill->id,
                'name' => $skill->skill_name,
                'created_at' => $skill->created_at,
                'updated_at' => $skill->updated_at,
            ];
        });
        return response()->json($skills, 200);
    }

    public function archived()
    {
        $skills = Skill::archived()->get(['id', 'skill_name', 'created_at', 'updated_at']);
        Log::info('Archived Skills Raw:', $skills->toArray()); // Debug raw data
        $skills = $skills->map(function ($skill) {
            return [
                'id' => $skill->id,
                'name' => $skill->skill_name,
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
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $skill = Skill::create([
            'skill_name' => $request->name,
            'archived' => false,
        ]);

        return response()->json([
            'id' => $skill->id,
            'name' => $skill->skill_name,
            'created_at' => $skill->created_at,
            'updated_at' => $skill->updated_at,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:skills,skill_name,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $skill->update([
            'skill_name' => $request->name,
        ]);

        return response()->json([
            'id' => $skill->id,
            'name' => $skill->skill_name,
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
<?php

namespace App\Http\Controllers;

use App\Models\Rank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class RankController extends Controller
{
    /**
     * Fetch all ranks with optional search, archived filter, and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $archived = $request->query('archived', null);
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 5);

            $query = Rank::query();

            if (!empty($search)) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            if (!is_null($archived)) {
                $query->where('archived', $archived === 'true');
            }

            // Check if min_points and max_points columns exist before selecting them
            $columns = ['id', 'name', 'image', 'created_at', 'updated_at', 'archived'];
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $columns[] = 'min_points';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'max_points')) {
                $columns[] = 'max_points';
            }
            
            // Only order by min_points if the column exists
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $query->orderBy('min_points', 'asc');
            } else {
                $query->orderBy('id', 'asc');
            }
            
            $ranks = $query->paginate($limit, $columns, 'page', $page);

            return response()->json([
                'ranks' => $ranks->items(),
                'pagination' => [
                    'currentPage' => $ranks->currentPage(),
                    'totalPages' => $ranks->lastPage(),
                    'totalItems' => $ranks->total(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching ranks: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch ranks'], 500);
        }
    }

    /**
     * Add a new rank.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info("Store request data: " . json_encode($request->all()));
            // Build validation rules based on whether columns exist
            $validationRules = [
                'name' => 'required|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ];
            
            // Only require min_points/max_points if columns exist
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $validationRules['min_points'] = 'required|integer|min:0';
                $validationRules['max_points'] = 'nullable|integer|min:0|gt:min_points';
            }
            
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                Log::error("Validation failed in store: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('img/rank', 'public');
            }

            $rankData = [
                'name' => $request->name,
                'image' => $imagePath,
                'archived' => false,
            ];
            
            // Only add min_points/max_points if columns exist
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $rankData['min_points'] = $request->min_points ?? 0;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'max_points')) {
                $rankData['max_points'] = $request->max_points ?? null;
            }
            
            $rank = Rank::create($rankData);

            return response()->json([
                'message' => 'Rank created successfully',
                'rank' => $rank,
            ], 201);
        } catch (\Exception $e) {
            Log::error("Error creating rank: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create rank'], 500);
        }
    }

    /**
     * Update an existing rank.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info("Update request data for rank ID {$id}: " . json_encode($request->all()));
            $rank = Rank::find($id);

            if (!$rank) {
                Log::error("Rank not found for ID {$id}");
                return response()->json(['error' => 'Rank not found'], 404);
            }

            // Build validation rules based on whether columns exist
            $validationRules = [
                'name' => 'required|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ];
            
            // Only require min_points/max_points if columns exist
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $validationRules['min_points'] = 'required|integer|min:0';
                $validationRules['max_points'] = 'nullable|integer|min:0|gt:min_points';
            }
            
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                Log::error("Validation failed in update for rank ID {$id}: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $imagePath = $rank->image;
            if ($request->hasFile('image')) {
                if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $request->file('image')->store('img/rank', 'public');
            }

            $updateData = [
                'name' => $request->name,
                'image' => $imagePath,
            ];
            
            // Only update min_points/max_points if columns exist
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'min_points')) {
                $updateData['min_points'] = $request->min_points ?? 0;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('ranks', 'max_points')) {
                $updateData['max_points'] = $request->max_points ?? null;
            }
            
            $rank->update($updateData);

            return response()->json([
                'message' => 'Rank updated successfully',
                'rank' => $rank->refresh(),
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error updating rank ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to update rank'], 500);
        }
    }

    /**
     * Archive or restore a rank.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
    {
        try {
            $rank = Rank::find($id);

            if (!$rank) {
                Log::error("Rank not found for ID {$id}");
                return response()->json(['error' => 'Rank not found'], 404);
            }

            $archived = $request->input('archived', true);
            $rank->update([
                'archived' => $archived,
            ]);

            return response()->json([
                'message' => $archived ? 'Rank archived successfully' : 'Rank restored successfully',
                'rank' => $rank,
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error archiving/restoring rank ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to archive/restore rank'], 500);
        }
    }

    /**
     * Bulk archive or restore ranks.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'rank_ids' => 'required|array',
                'rank_ids.*' => 'integer|exists:ranks,id',
                'action' => 'required|in:archive,restore',
            ]);

            if ($validator->fails()) {
                Log::error("Validation failed in bulk archive: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $rankIds = $request->rank_ids;
            $archived = $request->action === 'archive';

            Rank::whereIn('id', $rankIds)->update(['archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Ranks archived successfully' : 'Ranks restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error in bulk archive/restore: " . $e->getMessage());
            return response()->json(['error' => 'Failed to perform bulk action'], 500);
        }
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Collar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CollarController extends Controller
{
    /**
     * Fetch all collars with optional search, archived filter, and pagination.
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

            $query = Collar::query();

            if (!empty($search)) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            // Apply archived filter - default to non-archived only
            if (!is_null($archived)) {
                $query->where('archived', $archived === 'true');
            } else {
                // Default behavior: only show non-archived collars
                $query->where('archived', false);
            }

            $collars = $query->paginate($limit, ['id', 'name', 'collar_img', 'created_at', 'updated_at', 'archived'], 'page', $page);

            return response()->json([
                'collars' => $collars->items(),
                'pagination' => [
                    'currentPage' => $collars->currentPage(),
                    'totalPages' => $collars->lastPage(),
                    'totalItems' => $collars->total(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching collars: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch collars'], 500);
        }
    }

    /**
     * Add a new collar.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info("Store request data: " . json_encode($request->all()));
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'collar_img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                Log::error("Validation failed in store: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $imagePath = null;
            if ($request->hasFile('collar_img')) {
                $imagePath = $request->file('collar_img')->store('img/collar', 'public');
            }

            $collar = Collar::create([
                'name' => $request->name,
                'collar_img' => $imagePath,
                'archived' => false,
            ]);

            return response()->json([
                'message' => 'Collar created successfully',
                'collar' => $collar,
            ], 201);
        } catch (\Exception $e) {
            Log::error("Error creating collar: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create collar'], 500);
        }
    }

    /**
     * Update an existing collar.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info("Update request data for collar ID {$id}: " . json_encode($request->all()));
            $collar = Collar::find($id);

            if (!$collar) {
                Log::error("Collar not found for ID {$id}");
                return response()->json(['error' => 'Collar not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'collar_img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                Log::error("Validation failed in update for collar ID {$id}: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $imagePath = $collar->collar_img;
            if ($request->hasFile('collar_img')) {
                if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $request->file('collar_img')->store('img/collar', 'public');
            }

            $collar->update([
                'name' => $request->name,
                'collar_img' => $imagePath,
            ]);

            return response()->json([
                'message' => 'Collar updated successfully',
                'collar' => $collar->refresh(),
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error updating collar ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to update collar'], 500);
        }
    }

    /**
     * Archive or restore a collar.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
    {
        try {
            $collar = Collar::find($id);

            if (!$collar) {
                Log::error("Collar not found for ID {$id}");
                return response()->json(['error' => 'Collar not found'], 404);
            }

            $archived = $request->input('archived', true);
            $collar->update([
                'archived' => $archived,
            ]);

            return response()->json([
                'message' => $archived ? 'Collar archived successfully' : 'Collar restored successfully',
                'collar' => $collar,
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error archiving/restoring collar ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to archive/restore collar'], 500);
        }
    }

    /**
     * Bulk archive or restore collars.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'collar_ids' => 'required|array',
                'collar_ids.*' => 'integer|exists:collars,id',
                'action' => 'required|in:archive,restore',
            ]);

            if ($validator->fails()) {
                Log::error("Validation failed in bulk archive: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $collarIds = $request->collar_ids;
            $archived = $request->action === 'archive';

            Collar::whereIn('id', $collarIds)->update(['archived' => $archived]);

            return response()->json([
                'message' => $archived ? 'Collars archived successfully' : 'Collars restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error in bulk archive/restore: " . $e->getMessage());
            return response()->json(['error' => 'Failed to perform bulk action'], 500);
        }
    }
}
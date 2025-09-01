<?php

namespace App\Http\Controllers;

use App\Models\Collar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CollarsController extends Controller
{
    /**
     * Display a listing of collars with pagination and optional search.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->query('per_page', 5);
            $page = $request->query('page', 1);
            $search = $request->query('search', '');
            $archived = filter_var($request->query('archived', false), FILTER_VALIDATE_BOOLEAN);

            $query = Collar::query()
                ->when($search, function ($query, $search) {
                    return $query->where('name', 'like', "%{$search}%")
                                ->orWhere('color', 'like', "%{$search}%");
                })
                ->when($archived, function ($query) {
                    return $query->where('archived', true);
                }, function ($query) {
                    return $query->where('archived', false);
                });

            $total = $query->count();
            $collars = $query->skip(($page - 1) * $perPage)
                            ->take($perPage)
                            ->get();

            return response()->json([
                'collars' => $collars,
                'pagination' => [
                    'currentPage' => (int) $page,
                    'totalPages' => ceil($total / $perPage),
                    'totalItems' => $total,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to fetch collars', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch collars'], 500);
        }
    }

    /**
     * Store a newly created collar in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for collar creation', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all(),
                ]);
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            $collar = Collar::create([
                'name' => $request->input('name'),
                'color' => $request->input('color'),
                'archived' => false,
            ]);

            Log::info('Collar created successfully', ['collar_id' => $collar->id]);
            return response()->json($collar, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create collar', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->all(),
            ]);
            return response()->json(['error' => 'Failed to create collar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified collar.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $collar = Collar::findOrFail($id);
            return response()->json($collar, 200);
        } catch (\Exception $e) {
            Log::error('Collar not found', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Collar not found'], 404);
        }
    }

    /**
     * Update the specified collar in storage.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $collar = Collar::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for collar update', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all(),
                ]);
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            $collar->update([
                'name' => $request->input('name'),
                'color' => $request->input('color'),
            ]);

            Log::info('Collar updated successfully', ['collar_id' => $id]);
            return response()->json($collar, 200);
        } catch (\Exception $e) {
            Log::error('Failed to update collar', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to update collar'], 500);
        }
    }

    /**
     * Remove the specified collar from storage.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        try {
            $collar = Collar::findOrFail($id);
            $collar->delete();
            Log::info('Collar deleted successfully', ['collar_id' => $id]);
            return response()->json(['message' => 'Collar deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Failed to delete collar', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to delete collar'], 500);
        }
    }

    /**
     * Archive a collar.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function archive(Request $request, $id)
    {
        try {
            $collar = Collar::findOrFail($id);
            $collar->update(['archived' => true]);
            Log::info('Collar archived successfully', ['collar_id' => $id]);
            return response()->json(['message' => 'Collar archived successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Failed to archive collar', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to archive collar'], 500);
        }
    }

    /**
     * Restore an archived collar.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore(Request $request, $id)
    {
        try {
            $collar = Collar::findOrFail($id);
            $collar->update(['archived' => false]);
            Log::info('Collar restored successfully', ['collar_id' => $id]);
            return response()->json(['message' => 'Collar restored successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Failed to restore collar', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to restore collar'], 500);
        }
    }

    /**
     * Bulk archive collars.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkArchive(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'collar_ids' => 'required|array',
                'collar_ids.*' => 'integer|exists:collars,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk archive', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            Collar::whereIn('id', $request->collar_ids)->update(['archived' => true]);
            Log::info('Collars bulk archived successfully', ['collar_ids' => $request->collar_ids]);
            return response()->json(['message' => 'Collars archived successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Failed to bulk archive collars', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to archive collars'], 500);
        }
    }

    /**
     * Bulk restore collars.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkRestore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'collar_ids' => 'required|array',
                'collar_ids.*' => 'integer|exists:collars,id',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for bulk restore', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            Collar::whereIn('id', $request->collar_ids)->update(['archived' => false]);
            Log::info('Collars bulk restored successfully', ['collar_ids' => $request->collar_ids]);
            return response()->json(['message' => 'Collars restored successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Failed to bulk restore collars', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to restore collars'], 500);
        }
    }
}
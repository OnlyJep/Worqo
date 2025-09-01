<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RolesController extends Controller
{
    /**
     * Fetch roles with IDs 1 and 2 (for specific use case).
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $roles = Role::whereIn('id', [1, 2])->get(['id', 'role_name']);
        return response()->json($roles, 200);
    }

    /**
     * Fetch all roles with optional search, archived filter, and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function all(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search', '');
            $archived = $request->query('archived', null);
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 5);

            $query = Role::query();

            // Apply search filter
            if (!empty($search)) {
                $query->where('role_name', 'like', '%' . $search . '%');
            }

            // Apply archived filter
            if (!is_null($archived)) {
                $query->where('archived', $archived === 'true');
            }

            // Paginate results
            $roles = $query->paginate($limit, ['id', 'role_name', 'created_at', 'updated_at', 'archived'], 'page', $page);

            return response()->json([
                'roles' => $roles->items(),
                'pagination' => [
                    'currentPage' => $roles->currentPage(),
                    'totalPages' => $roles->lastPage(),
                    'totalItems' => $roles->total(),
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching all roles: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch roles'], 500);
        }
    }

    /**
     * Add a new role.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $role = Role::create([
            'role_name' => $request->role_name,
            'archived' => false,
        ]);

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role,
        ], 201);
    }

    /**
     * Update an existing role.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['error' => 'Role not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $role->update([
            'role_name' => $request->role_name,
        ]);

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role,
        ], 200);
    }

    /**
     * Archive or restore a role.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function archive(Request $request, $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['error' => 'Role not found'], 404);
        }

        $archived = $request->input('archived', true);
        $role->update([
            'archived' => $archived,
        ]);

        return response()->json([
            'message' => $archived ? 'Role archived successfully' : 'Role restored successfully',
            'role' => $role,
        ], 200);
    }

    /**
     * Bulk archive or restore roles.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,id',
            'action' => 'required|in:archive,restore',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $roleIds = $request->role_ids;
        $archived = $request->action === 'archive';

        Role::whereIn('id', $roleIds)->update(['archived' => $archived]);

        return response()->json([
            'message' => $archived ? 'Roles archived successfully' : 'Roles restored successfully',
        ], 200);
    }
}
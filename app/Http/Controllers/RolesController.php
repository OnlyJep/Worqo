<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RolesController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::whereIn('id', [1, 2])->get(['id', 'role_name']);
        return response()->json($roles, 200);
    }

    public function all(): JsonResponse
    {
        try {
            $roles = Role::whereIn('id', [1, 2, 3])->get(['id', 'role_name']);
            return response()->json($roles, 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching all roles: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch roles'], 500);
        }
    }
}
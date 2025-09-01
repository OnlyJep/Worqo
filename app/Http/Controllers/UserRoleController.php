<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UserRoleController extends Controller
{
    public function fetchUsersByRole(Request $request)
    {
        try {
            $roleId = $request->query('role_id');

            if (!in_array($roleId, ['1', '2'])) {
                return response()->json(['message' => 'Invalid role_id. Must be 1 (worker) or 2 (employer).'], 400);
            }

            $users = User::where('archived', false)
                ->where('role_id', $roleId)
                ->with(['profile.suffix'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'role_id' => $user->role_id,
                        'first_name' => $user->profile ? $user->profile->first_name : null,
                        'middlename' => $user->profile ? $user->profile->middlename : null,
                        'last_name' => $user->profile ? $user->profile->last_name : null,
                        'suffix' => $user->profile && $user->profile->suffix ? $user->profile->suffix->suffix_name : null,
                    ];
                });

            if ($users->isEmpty()) {
                return response()->json(['message' => 'No users found for the specified role.'], 404);
            }

            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching users by role: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }
}
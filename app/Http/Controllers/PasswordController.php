<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        try {
            // Validate the request
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'confirm_password' => 'required|string|same:new_password'
            ]);

            // Get the authenticated user
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'User not authenticated'
                ], 401);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'error' => 'Current password is incorrect'
                ], 400);
            }

            // Check if new password is different from current
            if (Hash::check($request->new_password, $user->password)) {
                return response()->json([
                    'error' => 'New password must be different from current password'
                ], 400);
            }

            // Update the password
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'message' => 'Password changed successfully'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Password change error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to change password',
                'message' => 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }

    /**
     * Change password for a specific user (admin function)
     */
    public function changeUserPassword(Request $request, $userId)
    {
        try {
            // Validate the request
            $request->validate([
                'new_password' => 'required|string|min:6',
                'confirm_password' => 'required|string|same:new_password'
            ]);

            // Find the user
            $user = User::find($userId);
            
            if (!$user) {
                return response()->json([
                    'error' => 'User not found'
                ], 404);
            }

            // Update the password
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'message' => 'Password changed successfully for user'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Admin password change error: ' . $e->getMessage(), [
                'admin_id' => Auth::id(),
                'target_user_id' => $userId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to change password',
                'message' => 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }
}


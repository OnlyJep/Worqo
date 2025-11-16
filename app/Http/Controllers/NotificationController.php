<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    private function resolveUserId(Request $request)
    {
        if ($request->user()) {
            return $request->user()->id;
        }
        $headerId = $request->header('X-User-Id');
        if (is_numeric($headerId)) {
            return (int)$headerId;
        }
        $queryId = $request->input('user_id');
        if (is_numeric($queryId)) {
            return (int)$queryId;
        }
        return null;
    }

    // Get all notifications for the authenticated user
    public function index(Request $request)
    {
        try {
            $userId = $this->resolveUserId($request);
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing user_id'
                ], 400);
            }
            
            $notifications = Notification::with(['sender.profile', 'user.profile'])
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format notifications for frontend
            $formattedNotifications = $notifications->map(function($notif) {
                $senderName = 'WORQO Job Portal';
                $senderProfileImg = 'images/worqo_icon.svg';
                
                if ($notif->sender) {
                    $profile = $notif->sender->profile;
                    $firstName = $profile->first_name ?? '';
                    $lastName = $profile->last_name ?? '';
                    $suffix = $profile->suffix_name ?? '';
                    $senderName = trim("$firstName $lastName $suffix");
                    $senderProfileImg = $profile->profile_img ?: 'images/defpfp.svg';
                }

                // Check if message contains special link format
                $message = $notif->message;
                $targetRoleId = null;
                
                // For booking notifications, set target_role_id to show the "Click here" link in frontend
                if ($notif->type === 'booking') {
                    // Determine target role based on current user role
                    // If current user is employer (role_id = 2), target role should be worker (role_id = 1)
                    // If current user is worker (role_id = 1), target role should be employer (role_id = 2)
                    $currentUser = User::find($notif->user_id);
                    if ($currentUser) {
                        $targetRoleId = $currentUser->role_id == 2 ? 1 : 2;
                    }
                }
                
                // Check for the special link format in the message (legacy support)
                if (strpos($message, 'Click Here to go to@') !== false) {
                    // Extract the URL part
                    $parts = explode('Click Here to go to@', $message);
                    if (count($parts) > 1) {
                        // Remove the special link format from message
                        $message = trim($parts[0]);
                    }
                }
                
                // Also remove any "Click Here to go to http://..." text that might be in the message
                $message = preg_replace('/\s*Click Here to go to\s+https?:\/\/[^\s]+/i', '', $message);
                $message = trim($message);

                return [
                    'id' => $notif->id,
                    'user' => $senderName,
                    'action' => $notif->title,
                    'message' => $message,
                    'type' => $notif->type,
                    'time' => $notif->created_at->diffForHumans(),
                    'profile_img' => $senderProfileImg,
                    'isUnread' => !$notif->is_read,
                    'related_id' => $notif->related_id,
                    'related_type' => $notif->related_type,
                    'sender_id' => $notif->sender_id,
                    'sender_role_id' => $notif->sender ? $notif->sender->role_id : null,
                    'target_role_id' => $targetRoleId, // Add target role ID for frontend
                ];
            });

            return response()->json([
                'success' => true,
                'notifications' => $formattedNotifications,
                'unread_count' => $notifications->where('is_read', false)->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
            ], 500);
        }
    }

    // Get unread notifications count
    public function unreadCount(Request $request)
    {
        try {
            $userId = $this->resolveUserId($request);
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing user_id'
                ], 400);
            }
            $count = Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'unread_count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching unread count: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch unread count',
            ], 500);
        }
    }

    // Mark notification as read
    public function markAsRead($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            
            // Ensure user can only mark their own notifications
            $req = request();
            $resolvedUserId = $this->resolveUserId($req);
            if ($notification->user_id !== $resolvedUserId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
            ], 500);
        }
    }

    // Mark notification as unread
    public function markAsUnread($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            
            // Ensure user can only mark their own notifications
            $req = request();
            $resolvedUserId = $this->resolveUserId($req);
            if ($notification->user_id !== $resolvedUserId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $notification->update([
                'is_read' => false,
                'read_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as unread',
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking notification as unread: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as unread',
            ], 500);
        }
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        try {
            $userId = $this->resolveUserId($request);
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing user_id'
                ], 400);
            }
            
            Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
            ], 500);
        }
    }

    // Delete notification
    public function destroy($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            
            // Ensure user can only delete their own notifications
            $req = request();
            $resolvedUserId = $this->resolveUserId($req);
            if ($notification->user_id !== $resolvedUserId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
            ], 500);
        }
    }

    // Helper method to create a notification
    public static function createNotification($userId, $senderId, $type, $title, $message, $relatedId = null, $relatedType = null)
    {
        try {
            Notification::create([
                'user_id' => $userId,
                'sender_id' => $senderId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'related_id' => $relatedId,
                'related_type' => $relatedType,
            ]);
            
            Log::info("Notification created for user $userId: $title");
            return true;
        } catch (\Exception $e) {
            Log::error('Error creating notification: ' . $e->getMessage());
            return false;
        }
    }
}

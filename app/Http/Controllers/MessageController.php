<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Models\Worker;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\Rank;
use App\Models\Service;
use App\Models\Collar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    private function resolveUserId(Request $request)
    {
        // First try to get user from auth token
        if (Auth::guard('api')->check()) {
            return Auth::guard('api')->id();
        }
        
        // Then try to get from request headers
        $headerId = $request->header('X-User-Id');
        if (is_numeric($headerId)) {
            return (int)$headerId;
        }
        
        // Finally try to get from query parameters
        $queryId = $request->input('user_id');
        if (is_numeric($queryId)) {
            return (int)$queryId;
        }
        
        // Try to get from request body
        $bodyId = $request->input('sender_id');
        if (is_numeric($bodyId)) {
            return (int)$bodyId;
        }
        
        return null;
    }
    
    /**
     * Get detailed user information including profile, worker details, collar, and online status
     */
    private function getDetailedUserInfo($userId)
    {
        $user = User::with(['profile.suffix', 'worker.rank'])->find($userId);
        
        if (!$user) {
            return null;
        }
        
        $profile = $user->profile;
        $worker = $user->worker;
        
        // Get user name
        $fullName = '';
        if ($profile) {
            $fullName = trim(
                ($profile->first_name ?? '') . ' ' .
                ($profile->middlename ?? '') . ' ' .
                ($profile->last_name ?? '') . ' ' .
                ($profile->suffix ? $profile->suffix->suffix_name : '')
            );
        }
        
        // Get worker details
        $workerDetails = null;
        if ($worker) {
            // Get collar based on skills
            $collar = null;
            
            if ($worker->skills_id) {
                $skillsData = is_string($worker->skills_id) ? json_decode($worker->skills_id, true) : $worker->skills_id;
                
                // Handle both flat array and structured format
                if (is_array($skillsData)) {
                    if (isset($skillsData['primary_skills']) || isset($skillsData['additional_skills'])) {
                        // Structured format
                        $primarySkills = $skillsData['primary_skills'] ?? [];
                        $additionalSkills = $skillsData['additional_skills'] ?? [];
                        $allSkills = array_merge($primarySkills, $additionalSkills);
                    } else {
                        // Flat array format
                        $allSkills = $skillsData;
                    }
                    
                    // Extract skill IDs
                    $skillIds = [];
                    foreach ($allSkills as $skillData) {
                        if (is_array($skillData) && isset($skillData['skill_id'])) {
                            $skillIds[] = $skillData['skill_id'];
                        } elseif (is_numeric($skillData)) {
                            $skillIds[] = $skillData;
                        }
                    }
                    
                    // Determine collar based on skills
                    if (!empty($skillIds)) {
                        // Find services that match these skills
                        $services = Service::where(function ($query) use ($skillIds) {
                            foreach ($skillIds as $skillId) {
                                $query->orWhereJsonContains('skills_id', (string)$skillId)
                                      ->orWhereJsonContains('skills_id', (int)$skillId);
                            }
                        })->with('collar')->get();
                        
                        // Get the first collar from matching services
                        if ($services->isNotEmpty()) {
                            $collar = $services->first()->collar;
                        }
                    }
                }
            }
            
            $workerDetails = [
                'verified' => $worker->verified ?? false,
                'rank' => $worker->rank ? [
                    'id' => $worker->rank->id,
                    'name' => $worker->rank->name,
                    'image' => $worker->rank->image,
                ] : null,
                'collar' => $collar ? [
                    'id' => $collar->id,
                    'name' => $collar->name,
                    'image' => $collar->collar_img,
                ] : null,
            ];
        }
        
        // Censor contact number
        $censoredContact = null;
        if ($profile && $profile->contact_number) {
            $contact = $profile->contact_number;
            if (strlen($contact) > 5) {
                $censoredContact = substr($contact, 0, 5) . '*****';
            } else {
                $censoredContact = '***';
            }
        }
        
        // Check online status based on last activity
        $isOnline = false;
        $lastActiveText = 'Offline';
        if ($user->last_activity) {
            $lastActivity = $user->last_activity;
            $minutesAgo = $lastActivity->diffInMinutes(now());
            
            if ($minutesAgo < 5) {
                $isOnline = true;
                $lastActiveText = 'Online';
            } else if ($minutesAgo < 60) {
                $lastActiveText = "Active {$minutesAgo} minute" . ($minutesAgo == 1 ? '' : 's') . " ago";
            } else {
                $hoursAgo = floor($minutesAgo / 60);
                $lastActiveText = "Active {$hoursAgo} hour" . ($hoursAgo == 1 ? '' : 's') . " ago";
            }
        } else {
            // Fallback to updated_at if last_activity is not set
            if ($user->updated_at) {
                $minutesAgo = $user->updated_at->diffInMinutes(now());
                if ($minutesAgo < 15) {
                    $isOnline = true;
                    $lastActiveText = 'Online';
                } else if ($minutesAgo < 60) {
                    $lastActiveText = "Active {$minutesAgo} minute" . ($minutesAgo == 1 ? '' : 's') . " ago";
                } else {
                    $hoursAgo = floor($minutesAgo / 60);
                    $lastActiveText = "Active {$hoursAgo} hour" . ($hoursAgo == 1 ? '' : 's') . " ago";
                }
            }
        }
        
        return [
            'id' => $user->id,
            'name' => $fullName ?: 'Unknown User',
            'profile_img' => $profile->profile_img ?? null,
            'role_id' => $user->role_id,
            'contact_number' => $censoredContact,
            'is_online' => $isOnline,
            'last_active_text' => $lastActiveText,
            'worker' => $workerDetails,
        ];
    }
    
    /**
     * List conversations for the authenticated user.
     */
    public function conversations(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Missing user_id'], 400);
        }

        $conversations = Message::selectRaw('CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as other_user_id, MAX(created_at) as last_message_at', [$userId])
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('recipient_id', $userId);
            })
            ->groupBy('other_user_id')
            ->orderByDesc('last_message_at')
            ->get();

        $result = $conversations->map(function ($row) {
            $other = User::with('profile')->find($row->other_user_id);
            $profile = $other ? $other->profile : null;
            
            // Get detailed user info
            $detailedUserInfo = $this->getDetailedUserInfo($row->other_user_id);
            
            return [
                'user_id' => $other ? $other->id : null,
                'name' => trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')),
                'profile_img' => $profile->profile_img ?? null,
                'last_message_at' => $row->last_message_at,
                'detailed_info' => $detailedUserInfo,
            ];
        });

        return response()->json(['success' => true, 'conversations' => $result]);
    }

    /**
     * Fetch messages between auth user and another user.
     */
    public function thread(Request $request, $otherUserId)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Missing user_id'], 400);
        }

        $messages = Message::where(function ($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $userId)->where('recipient_id', $otherUserId);
            })
            ->orWhere(function ($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $otherUserId)->where('recipient_id', $userId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read messages received by the auth user
        Message::where('sender_id', $otherUserId)
            ->where('recipient_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        // Get detailed info for the other user
        $otherUserInfo = $this->getDetailedUserInfo($otherUserId);

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'other_user_info' => $otherUserInfo
        ]);
    }

    /**
     * Send a message to another user.
     */
    public function send(Request $request)
    {
        \Log::info('Message send request:', $request->all());
        
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Missing user_id'], 400);
        }
        
        $validator = Validator::make($request->all(), [
            'recipient_id' => 'required|integer|exists:users,id',
            'content' => 'required|string|max:5000',
        ]);
        
        // Custom validation: recipient_id must be different from sender_id
        $validator->after(function ($validator) use ($userId, $request) {
            if ($request->recipient_id == $userId) {
                $validator->errors()->add('recipient_id', 'You cannot send a message to yourself.');
            }
        });

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        
        \Log::info('Creating message with sender_id: ' . $userId . ', recipient_id: ' . $request->recipient_id);
        
        $message = Message::create([
            'sender_id' => $userId,
            'recipient_id' => $request->recipient_id,
            'content' => $request->content,
        ]);

        return response()->json(['success' => true, 'message' => $message], 201);
    }
}
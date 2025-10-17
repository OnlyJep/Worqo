<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;

// Test route to check user activity
Route::get('/test-user-activity/{id}', function ($id) {
    $user = User::find($id);
    
    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }
    
    $result = [
        'user_id' => $user->id,
        'last_activity' => $user->last_activity ? $user->last_activity->format('Y-m-d H:i:s') : null,
        'is_online' => false,
        'last_active_text' => 'Offline'
    ];
    
    if ($user->last_activity) {
        $minutesAgo = $user->last_activity->diffInMinutes(now());
        
        if ($minutesAgo < 5) {
            $result['is_online'] = true;
            $result['last_active_text'] = 'Online';
        } else if ($minutesAgo < 60) {
            $result['last_active_text'] = "Active {$minutesAgo} minute" . ($minutesAgo == 1 ? '' : 's') . " ago";
        } else {
            $hoursAgo = floor($minutesAgo / 60);
            $result['last_active_text'] = "Active {$hoursAgo} hour" . ($hoursAgo == 1 ? '' : 's') . " ago";
        }
    }
    
    return response()->json($result);
});

// Test route to update user activity
Route::post('/test-update-activity/{id}', function ($id) {
    $user = User::find($id);
    
    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }
    
    $user->last_activity = now();
    $user->save();
    
    return response()->json([
        'message' => 'User activity updated',
        'last_activity' => $user->last_activity->format('Y-m-d H:i:s')
    ]);
});
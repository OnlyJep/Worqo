<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UpdateUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Update user's last activity if they're authenticated
        if (Auth::check()) {
            try {
                $user = Auth::user();
                // Check if last_activity column exists and update accordingly
                if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_activity')) {
                    // Update last activity only if it's been more than 1 minute since last update
                    if (!$user->last_activity || $user->last_activity->diffInMinutes(now()) >= 1) {
                        Log::info('Updating user last activity', [
                            'user_id' => $user->id,
                            'previous_activity' => $user->last_activity,
                            'new_activity' => now()
                        ]);
                        $user->updateLastActivity();
                    }
                } else {
                    // If column doesn't exist, just touch updated_at occasionally
                    if (!$user->updated_at || $user->updated_at->diffInMinutes(now()) >= 5) {
                        $user->touch();
                    }
                }
            } catch (\Exception $e) {
                // Silently fail if there's an error
                Log::warning('Error updating user activity: ' . $e->getMessage());
            }
        }

        return $next($request);
    }
}
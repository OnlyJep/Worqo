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
            $user = Auth::user();
            // Update last activity only if it's been more than 1 minute since last update
            if (!$user->last_activity || $user->last_activity->diffInMinutes(now()) >= 1) {
                Log::info('Updating user last activity', [
                    'user_id' => $user->id,
                    'previous_activity' => $user->last_activity,
                    'new_activity' => now()
                ]);
                $user->updateLastActivity();
            }
        }

        return $next($request);
    }
}
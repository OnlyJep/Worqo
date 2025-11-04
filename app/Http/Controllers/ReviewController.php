<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $showArchived = $request->query('archived', false) === '1';
        $page = $request->query('page', 1);
        $perPage = 5;

        $query = Review::with(['user', 'reviewedUser'])
            ->where('archived', $showArchived);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('middlename', 'like', "%{$search}%")
                      ->orWhere('suffix', 'like', "%{$search}%");
                })
                ->orWhereHas('reviewedUser', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('middlename', 'like', "%{$search}%")
                      ->orWhere('suffix', 'like', "%{$search}%");
                })
                ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $reviews = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'total_pages' => $reviews->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reviewed_user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $reviewedUser = User::find($value);
                    if (!$reviewedUser) {
                        $fail('The reviewed user does not exist.');
                    }
                },
            ],
            'user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($request) {
                    $user = User::find($value);
                    $reviewedUser = User::find($request->reviewed_user_id);
                    if ($user && $reviewedUser && $user->id === $reviewedUser->id) {
                        $fail('Users cannot review themselves.');
                    }
                    
                    // If booking_id is provided, check for review by booking_id
                    // Otherwise, check by user combination (for backward compatibility)
                    if ($request->booking_id) {
                        $existingReview = Review::where('booking_id', $request->booking_id)
                            ->where('archived', false)
                            ->first();
                        if ($existingReview) {
                            $fail('A review already exists for this booking.');
                        }
                    } else {
                        $existingReview = Review::where('user_id', $value)
                            ->where('reviewed_user_id', $request->reviewed_user_id)
                            ->where('archived', false)
                            ->first();
                        if ($existingReview) {
                            $fail('A review already exists for this user combination.');
                        }
                    }
                },
            ],
            'booking_id' => 'nullable|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = Review::create([
            'user_id' => $validated['user_id'],
            'reviewed_user_id' => $validated['reviewed_user_id'],
            'booking_id' => $validated['booking_id'] ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'archived' => false,
        ]);

        return response()->json($review->load(['user', 'reviewedUser', 'booking']), 201);
    }

    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $validated = $request->validate([
            'reviewed_user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($request) {
                    $reviewedUser = User::find($value);
                    $user = User::find($request->user_id);
                    if ($user && $reviewedUser && $user->id === $reviewedUser->id) {
                        $fail('Users cannot review themselves.');
                    }
                },
            ],
            'user_id' => 'required|exists:users,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update([
            'user_id' => $validated['user_id'],
            'reviewed_user_id' => $validated['reviewed_user_id'],
            'booking_id' => $validated['booking_id'] ?? $review->booking_id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        return response()->json($review->load(['user', 'reviewedUser']));
    }

    public function archive($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['archived' => true]);
        return response()->json(['message' => 'Review archived']);
    }

    public function restore($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['archived' => false]);
        return response()->json(['message' => 'Review restored']);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'review_ids' => 'required|array',
            'review_ids.*' => 'exists:reviews,id',
            'action' => 'required|in:archive,restore',
        ]);

        Review::whereIn('id', $validated['review_ids'])
            ->update(['archived' => $validated['action'] === 'archive']);

        return response()->json(['message' => 'Bulk action completed']);
    }

    /**
     * Get reviews for a specific worker
     */
    public function getWorkerReviews($workerId)
    {
        try {
            // Verify the worker exists
            $worker = User::find($workerId);
            if (!$worker) {
                return response()->json(['error' => 'Worker not found'], 404);
            }

            // Get all non-archived reviews for this worker
            $reviews = Review::with(['user.profile'])
                ->where('reviewed_user_id', $workerId)
                ->where('archived', false)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format reviews with reviewer information
            $formattedReviews = $reviews->map(function ($review) {
                $reviewer = $review->user;
                $profile = $reviewer->profile ?? null;
                
                $reviewerName = 'Anonymous';
                if ($profile) {
                    $nameParts = array_filter([
                        $profile->first_name,
                        $profile->last_name
                    ]);
                    $reviewerName = implode(' ', $nameParts) ?: 'Anonymous';
                }

                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                    'reviewer' => [
                        'id' => $reviewer->id,
                        'name' => $reviewerName,
                        'profile_img' => $profile->profile_img ?? null,
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'reviews' => $formattedReviews,
                'average_rating' => $reviews->avg('rating'),
                'total_reviews' => $reviews->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker reviews: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch reviews'
            ], 500);
        }
    }
}
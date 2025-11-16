<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        try {
            $search = $request->query('search', '');
            $showArchived = $request->query('archived', false) === '1';
            $page = $request->query('page', 1);
            $perPage = 5;

            $query = Review::with(['user', 'reviewedUser'])
                ->where('archived', $showArchived)
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc');

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
        } catch (\Exception $e) {
            \Log::error('Error fetching reviews: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch reviews',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Validate basic fields first
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'reviewed_user_id' => 'required|integer|exists:users,id',
                'rating' => 'required|integer|min:1|max:5',
                'booking_id' => 'nullable|integer|exists:bookings,id',
                'comment' => 'nullable|string|max:1000',
            ]);
            
            // Additional validation after basic validation passes
            $userId = (int) $validated['user_id'];
            $reviewedUserId = (int) $validated['reviewed_user_id'];
            
            // Check if user is trying to review themselves
            if ($userId === $reviewedUserId) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => [
                        'reviewed_user_id' => ['Users cannot review themselves.']
                    ]
                ], 422);
            }
            
            // Only check for duplicate review if booking_id is provided
            // Multiple reviews are allowed for the same user combination (same employer can review same worker multiple times)
            if (isset($validated['booking_id']) && $validated['booking_id']) {
                // If booking_id is provided, check for review by booking_id (one review per booking)
                $existingReview = Review::where('booking_id', $validated['booking_id'])
                    ->where('archived', false)
                    ->first();
                if ($existingReview) {
                    return response()->json([
                        'error' => 'Validation failed',
                        'errors' => [
                            'booking_id' => ['A review already exists for this booking.']
                        ]
                    ], 422);
                }
            }
            // Note: Removed duplicate check by user combination to allow multiple reviews
            // from the same employer to the same worker (e.g., different bookings, different times)

            $review = Review::create([
                'user_id' => $userId,
                'reviewed_user_id' => $reviewedUserId,
                'booking_id' => $validated['booking_id'] ?? null,
                'rating' => (int) $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'archived' => false,
            ]);

            return response()->json($review->load(['user', 'reviewedUser', 'booking']), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating review: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create review',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating review: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update review',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function archive($id)
    {
        try {
            $review = Review::findOrFail($id);
            $review->update(['archived' => true]);
            return response()->json(['message' => 'Review archived']);
        } catch (\Exception $e) {
            \Log::error('Error archiving review: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to archive review',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            $review = Review::findOrFail($id);
            $review->update(['archived' => false]);
            return response()->json(['message' => 'Review restored']);
        } catch (\Exception $e) {
            \Log::error('Error restoring review: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to restore review',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkAction(Request $request)
    {
        try {
            $validated = $request->validate([
                'review_ids' => 'required|array',
                'review_ids.*' => 'exists:reviews,id',
                'action' => 'required|in:archive,restore',
            ]);

            Review::whereIn('id', $validated['review_ids'])
                ->update(['archived' => $validated['action'] === 'archive']);

            return response()->json(['message' => 'Bulk action completed']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error in bulk action: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to perform bulk action',
                'message' => $e->getMessage()
            ], 500);
        }
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
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
                    if ($user && $reviewedUser) {
                        if ($user->role_id === 1 && $reviewedUser->role_id !== 2) {
                            $fail('Workers can only review employers.');
                        } elseif ($user->role_id === 2 && $reviewedUser->role_id !== 1) {
                            $fail('Employers can only review workers.');
                        }
                    }
                },
            ],
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = Review::create([
            'user_id' => $validated['user_id'],
            'reviewed_user_id' => $validated['reviewed_user_id'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'archived' => false,
        ]);

        return response()->json($review->load(['user', 'reviewedUser']), 201);
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
                    if ($user && $reviewedUser) {
                        if ($user->role_id === 1 && $reviewedUser->role_id !== 2) {
                            $fail('Workers can only review employers.');
                        } elseif ($user->role_id === 2 && $reviewedUser->role_id !== 1) {
                            $fail('Employers can only review workers.');
                        }
                    }
                },
            ],
            'user_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update([
            'user_id' => $validated['user_id'],
            'reviewed_user_id' => $validated['reviewed_user_id'],
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
}
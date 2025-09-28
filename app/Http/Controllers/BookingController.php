<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * Create a new booking request
     */
    public function store(Request $request)
    {
        // Debug: Log the incoming request data
        \Log::info('Booking request received:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'worker_id' => 'required|exists:users,id',
            'service_type' => 'required|string|max:255',
            'work_type' => 'required|string|max:255',
            'description' => 'required|string',
            'book_in' => 'required|date',
            'book_end' => 'required|date|after:book_in',
            'hourly_rate' => 'required|numeric|min:0',
        ]);

        // Custom validation for book_in to be in the future
        $validator->after(function ($validator) use ($request) {
            if ($request->book_in) {
                // Parse the date and ensure it's in the correct timezone
                $bookIn = \Carbon\Carbon::parse($request->book_in)->setTimezone(config('app.timezone', 'UTC'));
                $now = \Carbon\Carbon::now();
                
                \Log::info('Date validation debug:', [
                    'book_in' => $request->book_in,
                    'parsed_book_in' => $bookIn->toDateTimeString(),
                    'current_time' => $now->toDateTimeString(),
                    'app_timezone' => config('app.timezone'),
                    'is_past' => $bookIn->isPast(),
                    'diff_in_minutes' => $now->diffInMinutes($bookIn, false)
                ]);
                
                // Allow bookings that are at least 1 hour in the future
                $hoursDifference = $now->diffInHours($bookIn, false);
                if ($hoursDifference < 1) {
                    $validator->errors()->add('book_in', 'The booking start time must be at least 1 hour in the future.');
                }
            }
        });

        if ($validator->fails()) {
                \Log::warning('Booking validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user is trying to book themselves
        $authUser = Auth::guard('api')->user();
        if ($authUser && $authUser->id == $request->worker_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot book yourself'
            ], 400);
        }

        // Check if there's already a pending booking between this employer and worker
        $existingBooking = Booking::where('employer_id', $authUser ? $authUser->id : null)
            ->where('worker_id', $request->worker_id)
            ->whereIn('status', ['pending', 'accepted'])
            ->first();

        if ($existingBooking) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending or accepted booking with this worker'
            ], 400);
        }

        // Calculate total amount
        $bookIn = Carbon::parse($request->book_in);
        $bookEnd = Carbon::parse($request->book_end);
        $hours = $bookIn->diffInHours($bookEnd);
        $totalAmount = $hours * $request->hourly_rate;

        $booking = Booking::create([
            'employer_id' => $authUser ? $authUser->id : null,
            'worker_id' => $request->worker_id,
            'service_type' => $request->service_type,
            'work_type' => $request->work_type,
            'description' => $request->description,
            'book_in' => $request->book_in,
            'book_end' => $request->book_end,
            'hourly_rate' => $request->hourly_rate,
            'total_amount' => $totalAmount,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking request sent successfully',
            'booking' => $booking
        ], 201);
    }

    /**
     * Get bookings for a worker
     */
    public function getWorkerBookings(Request $request)
    {
        try {
            // Get user ID from request header or query parameter
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            
            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID required'], 400);
            }

            $bookings = Booking::with(['employer.profile', 'worker.profile'])
                ->where('worker_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'bookings' => $bookings
            ]);
        } catch (\Exception $e) {
            \Log::error('getWorkerBookings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bookings for an employer
     */
    public function getEmployerBookings(Request $request)
    {
        try {
            // Get user ID from request header or query parameter
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            
            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID required'], 400);
            }

            $bookings = Booking::with(['employer.profile', 'worker.profile'])
                ->where('employer_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'bookings' => $bookings
            ]);
        } catch (\Exception $e) {
            \Log::error('getEmployerBookings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update booking status (for workers to accept/decline)
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,accepted,declined,cancelled,completed',
            'worker_notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $authUser = Auth::guard('api')->user();
        $booking = Booking::findOrFail($id);

        // Check if user is the worker for this booking
        if ($booking->worker_id != $authUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this booking'
            ], 403);
        }

        $booking->update([
            'status' => $request->status,
            'worker_notes' => $request->worker_notes
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking status updated successfully',
            'booking' => $booking
        ]);
    }

    /**
     * Add review and rating for completed booking
     */
    public function addReview(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $authUser = Auth::guard('api')->user();
        $booking = Booking::findOrFail($id);

        // Check if user is the employer for this booking
        if ($booking->employer_id != $authUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to review this booking'
            ], 403);
        }

        // Check if booking is completed
        if ($booking->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Can only review completed bookings'
            ], 400);
        }

        $booking->update([
            'rating' => $request->rating,
            'review' => $request->review
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review added successfully',
            'booking' => $booking
        ]);
    }

    /**
     * Get booking details
     */
    public function show($id)
    {
        $authUser = Auth::guard('api')->user();
        $booking = Booking::with(['employer.profile', 'worker.profile'])->findOrFail($id);

        // Check if user is either employer or worker
        if ($booking->employer_id != $authUser->id && $booking->worker_id != $authUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this booking'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'booking' => $booking
        ]);
    }

    /**
     * Cancel booking (for employers)
     */
    public function cancel($id)
    {
        $authUser = Auth::guard('api')->user();
        $booking = Booking::findOrFail($id);

        // Check if user is the employer
        if ($booking->employer_id != $authUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to cancel this booking'
            ], 403);
        }

        // Check if booking can be cancelled
        if (!in_array($booking->status, ['pending', 'accepted'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel booking with status: ' . $booking->status
            ], 400);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully',
            'booking' => $booking
        ]);
    }
}

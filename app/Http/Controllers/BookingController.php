<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\BookingRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Http\Controllers\NotificationController;

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
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'daily_rate' => 'required|numeric|min:0',
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

        // Calculate total amount based on daily rate
        $bookIn = Carbon::parse($request->book_in);
        $bookEnd = Carbon::parse($request->book_end);
        $days = $bookIn->diffInDays($bookEnd) + 1; // +1 to include both start and end days
        $totalAmount = $days * $request->daily_rate;

        $booking = Booking::create([
            'employer_id' => $authUser ? $authUser->id : null,
            'worker_id' => $request->worker_id,
            'service_type' => $request->service_type,
            'work_type' => $request->work_type,
            'description' => $request->description,
            'book_in' => $request->book_in,
            'book_end' => $request->book_end,
            'time_in' => $request->time_in,
            'time_out' => $request->time_out,
            'daily_rate' => $request->daily_rate,
            'total_amount' => $totalAmount,
            'status' => 'pending'
        ]);

        // Log the booking creation
        if ($authUser) {
            $booking->logAction('created', $authUser->id, 'Booking request created', [
                'service_type' => $request->service_type,
                'work_type' => $request->work_type,
                'daily_rate' => $request->daily_rate,
                'total_amount' => $totalAmount
            ]);
        }

        // Send notification to worker about new booking
        if ($authUser) {
            $employerName = $authUser->profile->first_name ?? 'Someone';
            NotificationController::createNotification(
                $request->worker_id,
                $authUser->id,
                'booking',
                'New Booking Request',
                "$employerName has sent you a booking request for {$request->service_type}. Please review and respond. Click Here to go to@http://127.0.0.1:8000/profile-settings/bookings",
                $booking->id,
                'booking'
            );
        }

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

            // Add review information to each booking
            $bookings->each(function ($booking) {
                $review = \App\Models\Review::where('user_id', $booking->employer_id)
                    ->where('reviewed_user_id', $booking->worker_id)
                    ->first();
                $booking->has_review = $review ? true : false;
                $booking->review_data = $review;
            });

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

            // Add review information to each booking
            $bookings->each(function ($booking) {
                $review = \App\Models\Review::where('user_id', $booking->employer_id)
                    ->where('reviewed_user_id', $booking->worker_id)
                    ->first();
                $booking->has_review = $review ? true : false;
                $booking->review_data = $review;
            });

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
            'status' => 'required|in:pending,accepted,declined,cancelled,completed'
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

        $oldStatus = $booking->status;
        $booking->update([
            'status' => $request->status
        ]);

        // Log the status update
        $booking->logAction($request->status, $authUser->id, "Booking status changed from {$oldStatus} to {$request->status}", [
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'service_type' => $booking->service_type
        ]);

        // Send notification to employer about status change
        if ($booking->employer_id && $oldStatus !== $request->status) {
            $workerName = $authUser->profile->first_name ?? 'Worker';
            
            if ($request->status === 'accepted') {
                NotificationController::createNotification(
                    $booking->employer_id,
                    $authUser->id,
                    'booking_accepted',
                    'Booking Accepted',
                    "$workerName has accepted your booking request for {$booking->service_type}.",
                    $booking->id,
                    'booking'
                );
            } elseif ($request->status === 'declined') {
                NotificationController::createNotification(
                    $booking->employer_id,
                    $authUser->id,
                    'booking_declined',
                    'Booking Declined',
                    "$workerName has declined your booking request for {$booking->service_type}.",
                    $booking->id,
                    'booking'
                );
            } elseif ($request->status === 'cancelled') {
                NotificationController::createNotification(
                    $booking->employer_id,
                    $authUser->id,
                    'booking_cancelled',
                    'Booking Cancelled',
                    "$workerName has cancelled the booking for {$booking->service_type}.",
                    $booking->id,
                    'booking'
                );
            } elseif ($request->status === 'completed') {
                NotificationController::createNotification(
                    $booking->employer_id,
                    $authUser->id,
                    'booking_completed',
                    'Booking Completed',
                    "$workerName has marked the booking for {$booking->service_type} as completed.",
                    $booking->id,
                    'booking'
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking status updated successfully',
            'booking' => $booking
        ]);
    }

    /**
     * Add review and rating for completed booking
     * Note: Reviews are now handled in the Review model/table
     */
    public function addReview(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string'
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

        // Create review in the reviews table
        $review = \App\Models\Review::create([
            'user_id' => $authUser->id,
            'reviewed_user_id' => $booking->worker_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'archived' => false
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review added successfully',
            'review' => $review
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

        $oldStatus = $booking->status;
        $booking->update(['status' => 'cancelled']);

        // Log the cancellation
        $booking->logAction('cancelled', $authUser->id, "Booking cancelled by employer", [
            'old_status' => $oldStatus,
            'service_type' => $booking->service_type,
            'cancelled_by' => 'employer'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully',
            'booking' => $booking
        ]);
    }
}

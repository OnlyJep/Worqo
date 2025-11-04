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
        \Log::info('=== BOOKING STORE REQUEST ===');
        \Log::info('Request data: ' . json_encode($request->all()));
        \Log::info('Employer ID from request: ' . $request->employer_id);
        \Log::info('Worker ID from request: ' . $request->worker_id);
        \Log::info('Request method: ' . $request->method());
        \Log::info('Request headers: ' . json_encode($request->headers->all()));
        \Log::info('Raw request content: ' . $request->getContent());
        
        // CRITICAL: Check if employer_id is actually in the request
        if (!$request->has('employer_id')) {
            \Log::error('CRITICAL: employer_id is missing from request!');
            \Log::error('Available request keys: ' . json_encode(array_keys($request->all())));
        }
        
        if ($request->employer_id === null || $request->employer_id === '') {
            \Log::error('CRITICAL: employer_id is null or empty in request!');
            \Log::error('employer_id value:', $request->employer_id);
            \Log::error('employer_id type:', gettype($request->employer_id));
        }
        
        $validator = Validator::make($request->all(), [
            'employer_id' => 'nullable|exists:users,id',
            'worker_id' => 'required|exists:users,id',
            'service_type' => 'required|string|max:255',
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'required|string|max:255',
            'description' => 'required|string',
            'book_in' => 'required|date',
            'book_end' => 'required|date|after:book_in',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'daily_rate' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,accepted,declined,cancelled,completed'
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

        // Ensure at least one participant is provided
        if (!$request->employer_id && !$request->worker_id) {
            return response()->json([
                'success' => false,
                'message' => 'At least one participant (employer or worker) must be selected'
            ], 422);
        }

        // Convert profile_id to user_id for database storage
        $bookingData = $request->all();
        
        \Log::info('Booking store request data: ' . json_encode($bookingData));
        \Log::info('Original request data: ' . json_encode($request->all()));
        
        // Use the provided IDs directly as they should be user IDs
        if ($request->employer_id) {
            $bookingData['employer_id'] = $request->employer_id;
            \Log::info('Using employer_id directly: ' . $request->employer_id);
        } else {
            \Log::warning('No employer_id provided in request!');
            // FALLBACK: Try to get employer_id from request headers (from localStorage)
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            if ($userId) {
                $bookingData['employer_id'] = $userId;
                \Log::info('FALLBACK: Using user ID from localStorage as employer_id: ' . $userId);
            } else {
                \Log::error('FALLBACK FAILED: No user ID found in request headers or query!');
                // CRITICAL: If no employer_id and no user ID from localStorage, we cannot create the booking
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create booking: No employer identified from localStorage'
                ], 422);
            }
        }
        
        if ($request->worker_id) {
            $bookingData['worker_id'] = $request->worker_id;
            \Log::info('Using worker_id directly: ' . $request->worker_id);
        } else {
            \Log::warning('No worker_id provided in request!');
        }
        
        // Ensure employer_id is not null before creating booking
        if (empty($bookingData['employer_id'])) {
            \Log::error('CRITICAL: employer_id is empty! Cannot create booking.');
            return response()->json([
                'success' => false,
                'message' => 'Employer ID is required but not provided'
            ], 422);
        }

        // Add archived field
        $bookingData['archived'] = false;
        
        $booking = Booking::create($bookingData);
        
        \Log::info('Booking created successfully with ID: ' . $booking->id);
        \Log::info('Created booking data: ' . json_encode($booking->toArray()));
        \Log::info('Final booking employer_id: ' . $booking->employer_id);
        \Log::info('Final booking worker_id: ' . $booking->worker_id);

        // Send notification to worker about new booking
        if ($booking->employer_id) {
            $employer = User::find($booking->employer_id);
            $employerName = $employer && $employer->profile ? $employer->profile->first_name : 'Someone';
            NotificationController::createNotification(
                $booking->worker_id,
                $booking->employer_id,
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
     * Get booking requests for a worker (pending bookings where worker is the target)
     */
    public function getWorkerBookingRequests(Request $request)
    {
        try {
            // Get user ID from request header or query parameter
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            
            \Log::info('getWorkerBookingRequests called with user_id: ' . $userId);
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID required'
                ], 400);
            }

            // Get all pending bookings where this user is the worker
            $bookingRequests = Booking::with(['employer.profile.suffix', 'worker.profile.suffix'])
                ->where('worker_id', $userId)
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            \Log::info('Found ' . $bookingRequests->count() . ' booking requests for worker_id: ' . $userId);

            // Format the booking requests
            $formattedRequests = $bookingRequests->map(function ($booking) {
                $employer = $booking->employer;
                $employerProfile = $employer ? $employer->profile : null;
                
                return [
                    'id' => $booking->id,
                    'employer_id' => $booking->employer_id,
                    'worker_id' => $booking->worker_id,
                    'service_type' => $booking->service_type,
                    'sub_skill' => $booking->sub_skill,
                    'work_type' => $booking->work_type,
                    'description' => $booking->description,
                    'book_in' => $booking->book_in,
                    'book_end' => $booking->book_end,
                    'time_in' => $booking->time_in,
                    'time_out' => $booking->time_out,
                    'hours_per_day' => $booking->hours_per_day,
                    'daily_rate' => $booking->daily_rate,
                    'total_amount' => $booking->total_amount,
                    'status' => $booking->status,
                    'archived' => $booking->archived,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                    'employer' => [
                        'id' => $employer ? $employer->id : null,
                        'username' => $employer ? $employer->username : 'Unknown',
                        'email' => $employer ? $employer->email : 'Unknown',
                        'profile' => $employerProfile ? [
                            'id' => $employerProfile->id,
                            'first_name' => $employerProfile->first_name,
                            'middlename' => $employerProfile->middlename,
                            'last_name' => $employerProfile->last_name,
                            'contact_number' => $employerProfile->contact_number,
                            'street' => $employerProfile->street,
                            'city' => $employerProfile->city,
                            'province' => $employerProfile->province,
                            'postal_code' => $employerProfile->postal_code,
                            'country' => $employerProfile->country,
                            'profile_img' => $employerProfile->profile_img,
                            'suffix' => $employerProfile->suffix ? [
                                'id' => $employerProfile->suffix->id,
                                'name' => $employerProfile->suffix->name
                            ] : null
                        ] : null
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Booking requests retrieved successfully',
                'booking_requests' => $formattedRequests,
                'total_count' => $formattedRequests->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching worker booking requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bookings for a worker
     */
    public function getWorkerBookings(Request $request)
    {
        try {
            // Get user ID from request header or query parameter
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            
            \Log::info('getWorkerBookings called with user_id: ' . $userId);
            
            // Debug: Check all bookings in database first
            $allBookings = \App\Models\Booking::all();
            \Log::info('=== ALL BOOKINGS IN DATABASE (WORKER) ===');
            \Log::info('Total bookings count: ' . $allBookings->count());
            foreach ($allBookings as $booking) {
                \Log::info('Booking ID: ' . $booking->id . ', Employer ID: ' . $booking->employer_id . ', Worker ID: ' . $booking->worker_id . ', Status: ' . $booking->status);
            }
            
            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID required'], 400);
            }

            // Use the provided user ID directly to match the database
            $actualUserId = $userId;
            \Log::info('Searching for bookings with worker_id: ' . $actualUserId);

            $bookings = Booking::with(['employer.profile', 'worker.profile'])
                ->where('worker_id', $actualUserId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Add review information to each booking - check by booking_id
            $bookings->each(function ($booking) {
                $review = \App\Models\Review::where('booking_id', $booking->id)
                    ->where('archived', false)
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
            
            \Log::info('getEmployerBookings called with user_id: ' . $userId);
            \Log::info('Request headers: ' . json_encode($request->headers->all()));
            \Log::info('Request query: ' . json_encode($request->query()));
            \Log::info('Request all: ' . json_encode($request->all()));
            
            // Debug: Check all bookings in database first
            $allBookings = \App\Models\Booking::all();
            \Log::info('=== ALL BOOKINGS IN DATABASE ===');
            \Log::info('Total bookings count: ' . $allBookings->count());
            foreach ($allBookings as $booking) {
                \Log::info('Booking ID: ' . $booking->id . ', Employer ID: ' . $booking->employer_id . ', Worker ID: ' . $booking->worker_id . ', Status: ' . $booking->status);
            }
            
            if (!$userId) {
                \Log::error('No user ID provided in getEmployerBookings');
                return response()->json(['success' => false, 'message' => 'User ID required'], 400);
            }

            // Use the provided user ID directly to match the database
            $actualUserId = $userId;
            \Log::info('Searching for bookings with employer_id: ' . $actualUserId);
            
            // Debug: Check what bookings exist with this employer_id
            $debugBookings = Booking::where('employer_id', $actualUserId)->get();
            \Log::info('Debug: Found ' . $debugBookings->count() . ' bookings with employer_id: ' . $actualUserId);
            
            // Debug: Show all bookings in database to see what IDs exist
            $allBookings = Booking::select('id', 'employer_id', 'worker_id', 'service_type', 'status', 'created_at')->get();
            \Log::info('Debug: All bookings in database: ' . json_encode($allBookings->toArray()));

            $bookings = Booking::with(['employer.profile', 'worker.profile'])
                ->where('employer_id', $actualUserId)
                ->orderBy('created_at', 'desc')
                ->get();

        \Log::info('Found ' . $bookings->count() . ' bookings for employer_id: ' . $userId);
        \Log::info('Bookings data: ' . json_encode($bookings->toArray()));
        
        // Debug: Check all bookings in database
        $allBookings = \App\Models\Booking::with(['employer.profile', 'worker.profile'])->get();
        \Log::info('All bookings in database: ' . json_encode($allBookings->toArray()));
        \Log::info('Total bookings count: ' . $allBookings->count());

            // Add review information to each booking - check by booking_id
            $bookings->each(function ($booking) {
                $review = \App\Models\Review::where('booking_id', $booking->id)
                    ->where('archived', false)
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
        // Authorization relaxed per request: allow status updates from either party (employer/worker)

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
        try {
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

            // Get authenticated user (should be available via auth:api middleware)
            $authUser = Auth::guard('api')->user();
            
            if (!$authUser) {
                // Log for debugging
                \Log::warning('AddReview: No authenticated user', [
                    'has_auth_header' => $request->hasHeader('Authorization'),
                    'auth_header_value' => $request->header('Authorization') ? 'Bearer ***' : null,
                    'bearer_token' => $request->bearerToken() ? 'exists' : 'missing',
                    'booking_id' => $id
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in.'
                ], 401);
            }

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

            // Check if worker_id exists
            if (!$booking->worker_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking does not have a worker assigned'
                ], 400);
            }

            // Check for existing review for THIS specific booking - if exists, update it; otherwise create new
            $existingReview = \App\Models\Review::where('booking_id', $booking->id)
                ->where('archived', false)
                ->first();

            if ($existingReview) {
                // Update existing review
                $existingReview->update([
                    'rating' => $request->rating,
                    'comment' => $request->comment,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Review updated successfully',
                    'review' => $existingReview->fresh()
                ]);
            } else {
                // Create new review in the reviews table
                $review = \App\Models\Review::create([
                    'user_id' => $authUser->id,
                    'reviewed_user_id' => $booking->worker_id,
                    'booking_id' => $booking->id,
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
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error creating review: ' . $e->getMessage(), [
                'exception' => $e,
                'booking_id' => $id,
                'user_id' => $authUser->id ?? null,
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create review. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
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

    /**
     * Admin: Get all bookings with pagination and search
     */
    public function index(Request $request)
    {
        try {
            $query = Booking::with(['employer.profile.suffix', 'worker.profile.suffix']);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('service_type', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('work_type', 'like', "%{$searchTerm}%")
                      ->orWhere('status', 'like', "%{$searchTerm}%")
                      ->orWhereHas('employer.profile', function ($subQ) use ($searchTerm) {
                          $subQ->where('first_name', 'like', "%{$searchTerm}%")
                               ->orWhere('last_name', 'like', "%{$searchTerm}%")
                               ->orWhere('street', 'like', "%{$searchTerm}%")
                               ->orWhere('city', 'like', "%{$searchTerm}%")
                               ->orWhere('province', 'like', "%{$searchTerm}%")
                               ->orWhere('country', 'like', "%{$searchTerm}%");
                      })
                      ->orWhereHas('worker.profile', function ($subQ) use ($searchTerm) {
                          $subQ->where('first_name', 'like', "%{$searchTerm}%")
                               ->orWhere('last_name', 'like', "%{$searchTerm}%");
                      });
                });
            }

            // Archive filter
            if ($request->has('archived')) {
                $archived = $request->boolean('archived');
                $query->where('archived', $archived);
            }

            // Pagination
            $perPage = $request->get('limit', 10);
            $bookings = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Format the response
            $formattedBookings = $bookings->map(function ($booking) {
                // Helper function to format full name
                $formatFullName = function($profile) {
                    if (!$profile) return 'N/A';
                    
                    $name = $profile->first_name ?? '';
                    if ($profile->middlename) {
                        $name .= ' ' . $profile->middlename;
                    }
                    $name .= ' ' . ($profile->last_name ?? '');
                    if ($profile->suffix_id && $profile->suffix) {
                        $name .= ' ' . $profile->suffix->name;
                    }
                    return trim($name) ?: 'N/A';
                };

                // Helper function to format address
                $formatAddress = function($profile) {
                    if (!$profile) return 'N/A';
                    
                    $addressParts = [];
                    if ($profile->street) $addressParts[] = $profile->street;
                    if ($profile->city) $addressParts[] = $profile->city;
                    if ($profile->province) $addressParts[] = $profile->province;
                    if ($profile->postal_code) $addressParts[] = $profile->postal_code;
                    if ($profile->country) $addressParts[] = $profile->country;
                    
                    return $addressParts ? implode(', ', $addressParts) : 'N/A';
                };

                return [
                    'id' => $booking->id,
                    'employer_id' => $booking->employer_id,
                    'worker_id' => $booking->worker_id,
                    'employer_name' => $formatFullName($booking->employer ? $booking->employer->profile : null),
                    'worker_name' => $formatFullName($booking->worker ? $booking->worker->profile : null),
                    'employer' => $booking->employer ? [
                        'id' => $booking->employer->id,
                        'email' => $booking->employer->email,
                        'profile' => $booking->employer->profile ? [
                            'id' => $booking->employer->profile->id,
                            'first_name' => $booking->employer->profile->first_name,
                            'last_name' => $booking->employer->profile->last_name,
                            'middlename' => $booking->employer->profile->middlename,
                            'contact_number' => $booking->employer->profile->contact_number,
                            'street' => $booking->employer->profile->street,
                            'city' => $booking->employer->profile->city,
                            'province' => $booking->employer->profile->province,
                            'postal_code' => $booking->employer->profile->postal_code,
                            'country' => $booking->employer->profile->country,
                        ] : null
                    ] : null,
                    'worker' => $booking->worker ? [
                        'id' => $booking->worker->id,
                        'email' => $booking->worker->email,
                        'profile' => $booking->worker->profile ? [
                            'id' => $booking->worker->profile->id,
                            'first_name' => $booking->worker->profile->first_name,
                            'last_name' => $booking->worker->profile->last_name,
                            'middlename' => $booking->worker->profile->middlename,
                            'contact_number' => $booking->worker->profile->contact_number,
                            'street' => $booking->worker->profile->street,
                            'city' => $booking->worker->profile->city,
                            'province' => $booking->worker->profile->province,
                            'postal_code' => $booking->worker->profile->postal_code,
                            'country' => $booking->worker->profile->country,
                        ] : null
                    ] : null,
                    'service_type' => $booking->service_type,
                    'sub_skill' => $booking->sub_skill,
                    'work_type' => $booking->work_type,
                    'address' => $formatAddress($booking->employer ? $booking->employer->profile : null),
                    'description' => $booking->description,
                    'book_in' => $booking->book_in,
                    'book_end' => $booking->book_end,
                    'time_in' => $booking->time_in,
                    'time_out' => $booking->time_out,
                    'hours_per_day' => $booking->hours_per_day,
                    'daily_rate' => $booking->daily_rate,
                    'total_amount' => $booking->total_amount,
                    'status' => $booking->status,
                    'archived' => $booking->archived,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'bookings' => $formattedBookings,
                'pagination' => [
                    'currentPage' => $bookings->currentPage(),
                    'totalPages' => $bookings->lastPage(),
                    'totalItems' => $bookings->total(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Admin bookings index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Create new booking
     */
    public function create(Request $request)
    {
        \Log::info('=== BOOKING CREATION REQUEST ===');
        \Log::info('Request data: ' . json_encode($request->all()));
        \Log::info('Employer ID from request: ' . $request->employer_id);
        \Log::info('Worker ID from request: ' . $request->worker_id);
        \Log::info('Request method: ' . $request->method());
        \Log::info('Request headers: ' . json_encode($request->headers->all()));
        \Log::info('Raw request content: ' . $request->getContent());
        
        // CRITICAL: Check if employer_id is actually in the request
        if (!$request->has('employer_id')) {
            \Log::error('CRITICAL: employer_id is missing from request!');
            \Log::error('Available request keys: ' . json_encode(array_keys($request->all())));
        }
        
        if ($request->employer_id === null || $request->employer_id === '') {
            \Log::error('CRITICAL: employer_id is null or empty in request!');
            \Log::error('employer_id value:', $request->employer_id);
            \Log::error('employer_id type:', gettype($request->employer_id));
        }
        
        $validator = Validator::make($request->all(), [
            'employer_id' => 'nullable|exists:users,id',
            'worker_id' => 'nullable|exists:users,id',
            'service_type' => 'required|string|max:255',
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'required|string|max:255',
            'description' => 'required|string',
            'book_in' => 'required|date',
            'book_end' => 'required|date|after:book_in',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'hours_per_day' => 'nullable|numeric|min:0|max:24',
            'daily_rate' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,accepted,declined,cancelled,completed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Ensure at least one participant is provided
        if (!$request->employer_id && !$request->worker_id) {
            return response()->json([
                'success' => false,
                'message' => 'At least one participant (employer or worker) must be selected'
            ], 422);
        }

        // Convert profile_id to user_id for database storage
        $bookingData = $request->all();
        
        \Log::info('Booking creation request data: ' . json_encode($bookingData));
        \Log::info('Original request data: ' . json_encode($request->all()));
        
        // Use the provided IDs directly as they should be user IDs
        if ($request->employer_id) {
            $bookingData['employer_id'] = $request->employer_id;
            \Log::info('Using employer_id directly: ' . $request->employer_id);
        } else {
            \Log::warning('No employer_id provided in request!');
            // FALLBACK: Try to get employer_id from request headers (from localStorage)
            $userId = $request->header('X-User-ID') ?: $request->query('user_id');
            if ($userId) {
                $bookingData['employer_id'] = $userId;
                \Log::info('FALLBACK: Using user ID from localStorage as employer_id: ' . $userId);
            } else {
                \Log::error('FALLBACK FAILED: No user ID found in request headers or query!');
                // CRITICAL: If no employer_id and no user ID from localStorage, we cannot create the booking
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create booking: No employer identified from localStorage'
                ], 422);
            }
        }
        
        if ($request->worker_id) {
            $bookingData['worker_id'] = $request->worker_id;
            \Log::info('Using worker_id directly: ' . $request->worker_id);
        } else {
            \Log::warning('No worker_id provided in request!');
        }
        
        // Ensure employer_id is not null before creating booking
        if (empty($bookingData['employer_id'])) {
            \Log::error('CRITICAL: employer_id is empty! Cannot create booking.');
            return response()->json([
                'success' => false,
                'message' => 'Employer ID is required but not provided'
            ], 422);
        }

        // Add archived field
        $bookingData['archived'] = false;
        
        $booking = Booking::create($bookingData);
        
        \Log::info('Booking created successfully with ID: ' . $booking->id);
        \Log::info('Created booking data: ' . json_encode($booking->toArray()));
        \Log::info('Final booking employer_id: ' . $booking->employer_id);
        \Log::info('Final booking worker_id: ' . $booking->worker_id);

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking' => $booking
        ], 201);
    }

    /**
     * Admin: Update booking
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'employer_id' => 'nullable|exists:users,id',
            'worker_id' => 'nullable|exists:users,id',
            'service_type' => 'sometimes|required|string|max:255',
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'book_in' => 'sometimes|required|date',
            'book_end' => 'sometimes|required|date|after:book_in',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'hours_per_day' => 'nullable|numeric|min:0|max:24',
            'daily_rate' => 'sometimes|required|numeric|min:0',
            'total_amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,accepted,declined,cancelled,completed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $booking = Booking::findOrFail($id);
        
        // Convert profile_id to user_id for database storage
        $updateData = $request->all();
        
        if ($request->has('employer_id') && $request->employer_id) {
            $employerProfile = \App\Models\Profile::find($request->employer_id);
            $updateData['employer_id'] = $employerProfile ? $employerProfile->user_id : null;
        }
        
        if ($request->has('worker_id') && $request->worker_id) {
            $workerProfile = \App\Models\Profile::find($request->worker_id);
            $updateData['worker_id'] = $workerProfile ? $workerProfile->user_id : null;
        }
        
        $booking->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'booking' => $booking
        ]);
    }

    /**
     * Admin: Delete booking permanently
     */
    public function destroy($id)
    {
        $booking = Booking::findOrFail($id);
        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully'
        ]);
    }

    /**
     * Admin: Archive/Unarchive booking
     */
    public function archive(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'archived' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $booking = Booking::findOrFail($id);
        $booking->update(['archived' => $request->archived]);

        $action = $request->archived ? 'archived' : 'unarchived';
        return response()->json([
            'success' => true,
            'message' => "Booking {$action} successfully",
            'booking' => $booking
        ]);
    }

    /**
     * Admin: Bulk archive/unarchive bookings
     */
    public function bulkArchive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_ids' => 'required|array',
            'booking_ids.*' => 'exists:bookings,id',
            'action' => 'required|in:archive,restore'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $archived = $request->action === 'archive';
        Booking::whereIn('id', $request->booking_ids)
               ->update(['archived' => $archived]);

        $action = $archived ? 'archived' : 'restored';
        return response()->json([
            'success' => true,
            'message' => "Bookings {$action} successfully"
        ]);
    }

    /**
     * Admin: Bulk delete bookings
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_ids' => 'required|array',
            'booking_ids.*' => 'exists:bookings,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        Booking::whereIn('id', $request->booking_ids)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bookings deleted successfully'
        ]);
    }

    /**
     * Get all users with profiles for booking dropdowns
     */
    public function getAllUsersWithProfiles()
    {
        try {
            \Log::info('getAllUsersWithProfiles called');
            
            $users = User::with(['profile.suffix'])
                ->whereHas('profile')
                ->where('archived', false)
                ->get();

            \Log::info('Found users: ' . json_encode(['count' => $users->count()]));
            
            // Log first user details for debugging
            if ($users->count() > 0) {
                $firstUser = $users->first();
                \Log::info('First user details: ' . json_encode([
                    'user_id' => $firstUser->id,
                    'username' => $firstUser->username,
                    'email' => $firstUser->email,
                    'profile_id' => $firstUser->profile ? $firstUser->profile->id : 'No profile',
                    'profile_user_id' => $firstUser->profile ? $firstUser->profile->user_id : 'No profile',
                    'first_name' => $firstUser->profile ? $firstUser->profile->first_name : 'No profile',
                    'middlename' => $firstUser->profile ? $firstUser->profile->middlename : 'No profile',
                    'last_name' => $firstUser->profile ? $firstUser->profile->last_name : 'No profile',
                    'suffix_id' => $firstUser->profile ? $firstUser->profile->suffix_id : 'No profile',
                    'suffix_name' => $firstUser->profile && $firstUser->profile->suffix ? $firstUser->profile->suffix->name : 'No suffix'
                ]));
            }

            $formattedUsers = $users->map(function ($user) {
                $profile = $user->profile;
                if (!$profile) {
                    \Log::warning('User without profile:', ['user_id' => $user->id]);
                    return null;
                }

                // Format full name
                $name = $profile->first_name ?? '';
                if ($profile->middlename) {
                    $name .= ' ' . $profile->middlename;
                }
                $name .= ' ' . ($profile->last_name ?? '');
                if ($profile->suffix_id && $profile->suffix) {
                    $name .= ' ' . $profile->suffix->name;
                }
                $fullName = trim($name) ?: 'N/A';
                
                \Log::info('Name construction for user ' . $user->id . ': ' . json_encode([
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'suffix_name' => $profile->suffix ? $profile->suffix->name : null,
                    'constructed_name' => $name,
                    'final_fullName' => $fullName
                ]));
                
                \Log::info('Formatted name for user ' . $user->id . ': ' . json_encode([
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'suffix_id' => $profile->suffix_id,
                    'suffix_name' => $profile->suffix ? $profile->suffix->name : null,
                    'full_name' => $fullName
                ]));

                return [
                    'id' => $profile->id, // Return profile_id instead of user_id
                    'user_id' => $user->id, // Keep user_id for reference
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'suffix' => $profile->suffix ? $profile->suffix->name : null,
                    'full_name' => $fullName,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role_id' => $user->role_id
                ];
            })->filter(); // Remove null entries

            \Log::info('Formatted users: ' . json_encode(['count' => $formattedUsers->count()]));
            
            // Log all users with their role_ids for debugging
            \Log::info('All users with role_ids: ' . json_encode($formattedUsers->map(function($user) {
                return [
                    'id' => $user['id'],
                    'full_name' => $user['full_name'],
                    'role_id' => $user['role_id'],
                    'username' => $user['username']
                ];
            })->toArray()));
            
            // Log the first formatted user for debugging
            if ($formattedUsers->count() > 0) {
                $firstFormattedUser = $formattedUsers->first();
                \Log::info('First formatted user: ' . json_encode($firstFormattedUser));
            }

            return response()->json([
                'success' => true,
                'users' => $formattedUsers
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching users with profiles: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}

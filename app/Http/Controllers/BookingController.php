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
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'required|string|max:255',
            'description' => 'required|string',
            'book_in' => 'required|date',
            'book_end' => 'required|date|after:book_in',
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'daily_rate' => 'required|numeric|min:0',
            'total_salary' => 'nullable|numeric|min:0',
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

        // Get authenticated user if available (optional)
        $authUser = Auth::user();
        
        // Check if user is trying to book themselves (only if authenticated)
        if ($authUser && $authUser->id == $request->worker_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot book yourself'
            ], 400);
        }

        // Check if there's already a pending booking between this employer and worker (only if authenticated)
        $existingBooking = null;
        if ($authUser) {
            $existingBooking = Booking::where('employer_id', $authUser->id)
                ->where('worker_id', $request->worker_id)
                ->whereIn('status', ['pending', 'accepted'])
                ->first();
        }

        if ($existingBooking) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending or accepted booking with this worker'
            ], 400);
        }

        // Calculate total amount based on daily rate (use provided total_salary if available)
        $bookIn = Carbon::parse($request->book_in);
        $bookEnd = Carbon::parse($request->book_end);
        $days = $bookIn->diffInDays($bookEnd) + 1; // +1 to include both start and end days
        $totalAmount = $request->total_salary ?? ($days * $request->daily_rate);

        $booking = Booking::create([
            'employer_id' => $authUser ? $authUser->id : null,
            'worker_id' => $request->worker_id,
            'service_type' => $request->service_type,
            'sub_skill' => $request->sub_skill,
            'work_type' => $request->work_type,
            'description' => $request->description,
            'book_in' => $request->book_in,
            'book_end' => $request->book_end,
            'time_in' => $request->time_in,
            'time_out' => $request->time_out,
            'daily_rate' => $request->daily_rate,
            'total_amount' => $totalAmount,
            'status' => 'pending',
            'archived' => false
        ]);
        
        // Create BookingRequest record with BookModal data
        if ($authUser) {
            $bookModalData = [
                'service_type' => $request->service_type,
                'sub_skill' => $request->sub_skill,
                'work_type' => $request->work_type,
                'book_in' => $request->book_in,
                'book_end' => $request->book_end,
                'time_in' => $request->time_in,
                'time_out' => $request->time_out,
                'description' => $request->description,
                'daily_rate' => $request->daily_rate,
                'total_salary' => $totalAmount,
            ];
            
            \Log::info('Creating BookingRequest with data:', $bookModalData);
            $bookingRequest = BookingRequest::createFromBookModal($bookModalData, $authUser->id, $booking->id);
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
                    'employer_id' => $booking->employer && $booking->employer->profile ? $booking->employer->profile->id : null,
                    'worker_id' => $booking->worker && $booking->worker->profile ? $booking->worker->profile->id : null,
                    'employer_name' => $formatFullName($booking->employer ? $booking->employer->profile : null),
                    'worker_name' => $formatFullName($booking->worker ? $booking->worker->profile : null),
                    'service_type' => $booking->service_type,
                    'sub_skill' => $booking->sub_skill,
                    'work_type' => $booking->work_type,
                    'address' => $formatAddress($booking->employer ? $booking->employer->profile : null),
                    'description' => $booking->description,
                    'book_in' => $booking->book_in,
                    'book_end' => $booking->book_end,
                    'time_in' => $booking->time_in,
                    'time_out' => $booking->time_out,
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
        $validator = Validator::make($request->all(), [
            'employer_id' => 'nullable|exists:profiles,id',
            'worker_id' => 'nullable|exists:profiles,id',
            'service_type' => 'required|string|max:255',
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'required|string|max:255',
            'description' => 'required|string',
            'book_in' => 'required|date',
            'book_end' => 'required|date|after:book_in',
            'time_in' => 'nullable|date',
            'time_out' => 'nullable|date',
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
        
        if ($request->employer_id) {
            $employerProfile = \App\Models\Profile::find($request->employer_id);
            $bookingData['employer_id'] = $employerProfile ? $employerProfile->user_id : null;
        }
        
        if ($request->worker_id) {
            $workerProfile = \App\Models\Profile::find($request->worker_id);
            $bookingData['worker_id'] = $workerProfile ? $workerProfile->user_id : null;
        }

        // Add archived field
        $bookingData['archived'] = false;
        
        $booking = Booking::create($bookingData);

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
            'employer_id' => 'nullable|exists:profiles,id',
            'worker_id' => 'nullable|exists:profiles,id',
            'service_type' => 'sometimes|required|string|max:255',
            'sub_skill' => 'nullable|string|max:255',
            'work_type' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'book_in' => 'sometimes|required|date',
            'book_end' => 'sometimes|required|date|after:book_in',
            'time_in' => 'nullable|date',
            'time_out' => 'nullable|date',
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

            \Log::info('Found users:', ['count' => $users->count()]);
            
            // Log first user details for debugging
            if ($users->count() > 0) {
                $firstUser = $users->first();
                \Log::info('First user details:', [
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
                ]);
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
                
                \Log::info('Name construction for user ' . $user->id, [
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'suffix_name' => $profile->suffix ? $profile->suffix->name : null,
                    'constructed_name' => $name,
                    'final_fullName' => $fullName
                ]);
                
                \Log::info('Formatted name for user ' . $user->id, [
                    'first_name' => $profile->first_name,
                    'middlename' => $profile->middlename,
                    'last_name' => $profile->last_name,
                    'suffix_id' => $profile->suffix_id,
                    'suffix_name' => $profile->suffix ? $profile->suffix->name : null,
                    'full_name' => $fullName
                ]);

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

            \Log::info('Formatted users:', ['count' => $formattedUsers->count()]);
            
            // Log all users with their role_ids for debugging
            \Log::info('All users with role_ids:', $formattedUsers->map(function($user) {
                return [
                    'id' => $user['id'],
                    'full_name' => $user['full_name'],
                    'role_id' => $user['role_id'],
                    'username' => $user['username']
                ];
            })->toArray());
            
            // Log the first formatted user for debugging
            if ($formattedUsers->count() > 0) {
                $firstFormattedUser = $formattedUsers->first();
                \Log::info('First formatted user:', $firstFormattedUser);
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

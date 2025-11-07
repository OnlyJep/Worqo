<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Booking;
use App\Models\BookingRequest;

class BackfillBookingRequestsForExistingBookings extends Migration
{
    /**
     * Run the migrations.
     * Creates BookingRequest records for all existing bookings that don't have one.
     *
     * @return void
     */
    public function up()
    {
        // Get all bookings that don't have a corresponding BookingRequest
        $bookings = Booking::whereDoesntHave('bookingRequests')->get();
        
        foreach ($bookings as $booking) {
            // Only create BookingRequest if booking has both employer_id and worker_id
            if ($booking->employer_id && $booking->worker_id) {
                try {
                    BookingRequest::create([
                        'booking_id' => $booking->id,
                        'user_id' => $booking->employer_id, // The employer created the request
                        'service_type' => $booking->service_type,
                        'sub_skill' => $booking->sub_skill,
                        'work_type' => $booking->work_type,
                        'book_in' => $booking->book_in,
                        'book_end' => $booking->book_end,
                        'hours_per_day' => $booking->hours_per_day,
                        'description' => $booking->description,
                        'daily_rate' => $booking->daily_rate,
                        'total_amount' => $booking->total_amount,
                        'status' => $booking->status, // Use the booking's current status
                        'created_at' => $booking->created_at, // Preserve original creation time
                        'updated_at' => $booking->updated_at,
                    ]);
                } catch (\Exception $e) {
                    // Log error but continue with other bookings
                    \Log::error("Failed to create BookingRequest for booking ID {$booking->id}: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     * Remove BookingRequest records that were created by this migration.
     *
     * @return void
     */
    public function down()
    {
        // Optionally remove BookingRequests created during backfill
        // For safety, we'll just leave them as they provide valuable data
        // Uncomment below if you want to remove them:
        // BookingRequest::where('created_at', '>=', now())->delete();
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use App\Models\BookingRequest;

class BackfillBookingRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:backfill-requests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create BookingRequest records for existing bookings that dont have one';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Starting to backfill BookingRequest records...');

        // Get all bookings that don't have a corresponding BookingRequest
        $bookings = Booking::whereDoesntHave('bookingRequests')->get();
        
        $this->info("Found {$bookings->count()} bookings without BookingRequest records.");

        if ($bookings->count() === 0) {
            $this->info('No bookings need backfilling. All done!');
            return Command::SUCCESS;
        }

        $created = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($bookings as $booking) {
            // Only create BookingRequest if booking has both employer_id and worker_id
            if (!$booking->employer_id || !$booking->worker_id) {
                $this->warn("Skipping booking ID {$booking->id}: Missing employer_id or worker_id");
                $skipped++;
                continue;
            }

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
                
                $created++;
                $this->info("✓ Created BookingRequest for booking ID {$booking->id}");
            } catch (\Exception $e) {
                $errors++;
                $this->error("✗ Failed to create BookingRequest for booking ID {$booking->id}: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info("Backfill completed!");
        $this->info("  Created: {$created}");
        $this->info("  Skipped: {$skipped}");
        $this->info("  Errors: {$errors}");

        return Command::SUCCESS;
    }
}


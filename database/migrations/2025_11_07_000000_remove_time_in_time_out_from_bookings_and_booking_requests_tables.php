<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Database\MigrationSafe;

return new class extends Migration
{
    use MigrationSafe;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Each operation in its own transaction
        // Drop time_in and time_out from bookings table
        $this->safeDropColumn('bookings', ['time_in', 'time_out']);

        // Drop time_in and time_out from booking_requests table
        $this->safeDropColumn('booking_requests', ['time_in', 'time_out']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Each operation in its own transaction
        // Re-add time_in and time_out to bookings table
        if (!Schema::hasColumn('bookings', 'time_in')) {
            $this->safeAddColumn('bookings', function (Blueprint $table) {
                $table->string('time_in')->nullable()->after('book_end');
            });
        }
        
        if (!Schema::hasColumn('bookings', 'time_out')) {
            $this->safeAddColumn('bookings', function (Blueprint $table) {
                $table->string('time_out')->nullable()->after('time_in');
            });
        }

        // Re-add time_in and time_out to booking_requests table
        if (!Schema::hasColumn('booking_requests', 'time_in')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->time('time_in')->nullable()->after('book_end');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'time_out')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->time('time_out')->nullable()->after('time_in');
            });
        }
    }
};


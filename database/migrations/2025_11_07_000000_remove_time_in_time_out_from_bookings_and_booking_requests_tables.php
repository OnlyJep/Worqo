<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Safely drop time_in and time_out from bookings table if they exist
        if (Schema::hasTable('bookings')) {
            $columnsToDrop = [];
            if (Schema::hasColumn('bookings', 'time_in')) {
                $columnsToDrop[] = 'time_in';
            }
            if (Schema::hasColumn('bookings', 'time_out')) {
                $columnsToDrop[] = 'time_out';
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('bookings', function (Blueprint $table) use ($columnsToDrop) {
                    $table->dropColumn($columnsToDrop);
                });
            }
        }

        // Safely drop time_in and time_out from booking_requests table if they exist
        if (Schema::hasTable('booking_requests')) {
            $columnsToDrop = [];
            if (Schema::hasColumn('booking_requests', 'time_in')) {
                $columnsToDrop[] = 'time_in';
            }
            if (Schema::hasColumn('booking_requests', 'time_out')) {
                $columnsToDrop[] = 'time_out';
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('booking_requests', function (Blueprint $table) use ($columnsToDrop) {
                    $table->dropColumn($columnsToDrop);
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add time_in and time_out to bookings table if they don't exist
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                if (!Schema::hasColumn('bookings', 'time_in')) {
                    $table->string('time_in')->nullable()->after('book_end');
                }
                if (!Schema::hasColumn('bookings', 'time_out')) {
                    $table->string('time_out')->nullable()->after('time_in');
                }
            });
        }

        // Re-add time_in and time_out to booking_requests table if they don't exist
        if (Schema::hasTable('booking_requests')) {
            Schema::table('booking_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('booking_requests', 'time_in')) {
                    $table->time('time_in')->nullable()->after('book_end');
                }
                if (!Schema::hasColumn('booking_requests', 'time_out')) {
                    $table->time('time_out')->nullable()->after('time_in');
                }
            });
        }
    }
};


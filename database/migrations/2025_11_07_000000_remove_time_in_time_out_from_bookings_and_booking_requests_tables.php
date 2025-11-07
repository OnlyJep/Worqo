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
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['time_in', 'time_out']);
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            $table->dropColumn(['time_in', 'time_out']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('time_in')->nullable()->after('book_end');
            $table->string('time_out')->nullable()->after('time_in');
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            $table->time('time_in')->nullable()->after('book_end');
            $table->time('time_out')->nullable()->after('time_in');
        });
    }
};


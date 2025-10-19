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
            $table->string('time_in')->nullable()->after('book_end');
            $table->string('time_out')->nullable()->after('time_in');
            $table->decimal('daily_rate', 10, 2)->nullable()->after('time_out');
            $table->dropColumn('hourly_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('book_end');
            $table->dropColumn(['time_in', 'time_out', 'daily_rate']);
        });
    }
};

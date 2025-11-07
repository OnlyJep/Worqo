<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Drop the enum column
            $table->dropColumn('work_type');
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            // Add it back as a string to match the bookings table
            $table->string('work_type')->nullable()->after('sub_skill');
        });

        // Re-add the index
        Schema::table('booking_requests', function (Blueprint $table) {
            $table->index(['service_type', 'work_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Drop the string column and index
            $table->dropIndex(['service_type', 'work_type']);
            $table->dropColumn('work_type');
        });

        Schema::table('booking_requests', function (Blueprint $table) {
            // Add it back as enum
            $table->enum('work_type', ['full-time', 'part-time', 'one-time'])->nullable()->after('sub_skill');
            $table->index(['service_type', 'work_type']);
        });
    }
};


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FinalizeBookingRequestTableStructure extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Remove unnecessary columns
            $table->dropColumn([
                'hourly_rate',
                'salary_explanation'
            ]);
            
            // Add status column with enum values
            $table->enum('status', ['pending', 'declined', 'accepted', 'cancelled', 'completed'])
                  ->default('pending')
                  ->after('total_hours');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Remove status column
            $table->dropColumn('status');
            
            // Re-add the removed columns
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('total_hours');
            $table->text('salary_explanation')->nullable()->after('hourly_rate');
        });
    }
}

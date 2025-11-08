<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveWorkingDaysTotalHoursFromBookingRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('booking_requests')) {
            $columnsToDrop = [];
            if (Schema::hasColumn('booking_requests', 'working_days')) {
                $columnsToDrop[] = 'working_days';
            }
            if (Schema::hasColumn('booking_requests', 'total_hours')) {
                $columnsToDrop[] = 'total_hours';
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
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('booking_requests')) {
            Schema::table('booking_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('booking_requests', 'working_days')) {
                    $table->integer('working_days')->nullable()->after('total_amount');
                }
                if (!Schema::hasColumn('booking_requests', 'total_hours')) {
                    $table->decimal('total_hours', 8, 2)->nullable()->after('working_days');
                }
            });
        }
    }
}

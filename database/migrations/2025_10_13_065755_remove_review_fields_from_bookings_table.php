<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveReviewFieldsFromBookingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Remove review-related fields since they are now in the reviews table
            $table->dropColumn(['worker_notes', 'employer_notes', 'rating', 'review']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Re-add the columns if needed to rollback
            $table->text('worker_notes')->nullable()->after('status');
            $table->text('employer_notes')->nullable()->after('worker_notes');
            $table->integer('rating')->nullable()->after('employer_notes');
            $table->text('review')->nullable()->after('rating');
        });
    }
}

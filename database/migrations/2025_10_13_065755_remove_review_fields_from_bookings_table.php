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
        if (Schema::hasTable('bookings')) {
            $columnsToDrop = [];
            $columns = ['worker_notes', 'employer_notes', 'rating', 'review'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('bookings', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('bookings', function (Blueprint $table) use ($columnsToDrop) {
                    // Remove review-related fields since they are now in the reviews table
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
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                // Re-add the columns if needed to rollback
                if (!Schema::hasColumn('bookings', 'worker_notes')) {
                    $table->text('worker_notes')->nullable()->after('status');
                }
                if (!Schema::hasColumn('bookings', 'employer_notes')) {
                    $table->text('employer_notes')->nullable()->after('worker_notes');
                }
                if (!Schema::hasColumn('bookings', 'rating')) {
                    $table->integer('rating')->nullable()->after('employer_notes');
                }
                if (!Schema::hasColumn('bookings', 'review')) {
                    $table->text('review')->nullable()->after('rating');
                }
            });
        }
    }
}

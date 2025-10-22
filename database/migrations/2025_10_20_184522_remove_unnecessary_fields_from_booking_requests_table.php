<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveUnnecessaryFieldsFromBookingRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['employer_id']);
            $table->dropForeign(['worker_id']);
            
            // Drop indexes
            $table->dropIndex(['service_type', 'work_type']);
            $table->dropIndex(['book_in', 'book_end']);
            $table->dropIndex(['employer_id', 'worker_id']);
            
            // Drop unnecessary fields
            $table->dropColumn([
                'action',
                'notes', 
                'metadata',
                'is_available',
                'conflict_message',
                'conflicting_jobs',
                'employer_id',
                'worker_id'
            ]);
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
            // Re-add the columns
            $table->enum('action', ['created', 'accepted', 'declined', 'cancelled', 'completed', 'deleted'])->after('user_id');
            $table->text('notes')->nullable()->after('action');
            $table->json('metadata')->nullable()->after('notes');
            $table->boolean('is_available')->default(true)->after('salary_explanation');
            $table->text('conflict_message')->nullable()->after('is_available');
            $table->json('conflicting_jobs')->nullable()->after('conflict_message');
            $table->unsignedBigInteger('employer_id')->nullable()->after('conflicting_jobs');
            $table->unsignedBigInteger('worker_id')->nullable()->after('employer_id');
            
            // Re-add foreign key constraints
            $table->foreign('employer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('users')->onDelete('cascade');
            
            // Re-add indexes
            $table->index(['service_type', 'work_type']);
            $table->index(['book_in', 'book_end']);
            $table->index(['employer_id', 'worker_id']);
        });
    }
}

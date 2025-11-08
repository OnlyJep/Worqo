<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBookmodalFieldsToBookingRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // BookModal form fields
            $table->string('service_type')->nullable()->after('metadata');
            $table->string('sub_skill')->nullable()->after('service_type');
            $table->enum('work_type', ['full-time', 'part-time', 'one-time'])->nullable()->after('sub_skill');
            $table->datetime('book_in')->nullable()->after('work_type');
            $table->datetime('book_end')->nullable()->after('book_in');
            $table->text('description')->nullable()->after('book_end');
            $table->decimal('daily_rate', 10, 2)->nullable()->after('description');
            $table->decimal('total_amount', 10, 2)->nullable()->after('daily_rate');
            $table->integer('working_days')->nullable()->after('total_amount');
            $table->decimal('total_hours', 8, 2)->nullable()->after('working_days');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('total_hours');
            $table->text('salary_explanation')->nullable()->after('hourly_rate');
            
            // Additional fields for tracking
            $table->unsignedBigInteger('employer_id')->nullable()->after('salary_explanation');
            $table->unsignedBigInteger('worker_id')->nullable()->after('employer_id');
            $table->boolean('is_available')->default(true)->after('worker_id');
            $table->text('conflict_message')->nullable()->after('is_available');
            $table->json('conflicting_jobs')->nullable()->after('conflict_message');
            
            // Add foreign key constraints
            $table->foreign('employer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('users')->onDelete('cascade');
            
            // Add indexes for better performance
            $table->index(['service_type', 'work_type']);
            $table->index(['book_in', 'book_end']);
            $table->index(['employer_id', 'worker_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('booking_requests')) {
            // Drop foreign key constraints first (safely)
            if (Schema::hasColumn('booking_requests', 'employer_id')) {
                try {
                    Schema::table('booking_requests', function (Blueprint $table) {
                        $table->dropForeign(['employer_id']);
                    });
                } catch (\Throwable $e) {
                    // Foreign key might not exist, ignore
                }
            }
            
            if (Schema::hasColumn('booking_requests', 'worker_id')) {
                try {
                    Schema::table('booking_requests', function (Blueprint $table) {
                        $table->dropForeign(['worker_id']);
                    });
                } catch (\Throwable $e) {
                    // Foreign key might not exist, ignore
                }
            }
            
            // Drop indexes (safely)
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->dropIndex(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might not exist, ignore
            }
            
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->dropIndex(['book_in', 'book_end']);
                });
            } catch (\Throwable $e) {
                // Index might not exist, ignore
            }
            
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->dropIndex(['employer_id', 'worker_id']);
                });
            } catch (\Throwable $e) {
                // Index might not exist, ignore
            }
            
            // Drop columns (only if they exist)
            $columnsToDrop = [];
            $columns = [
                'service_type', 'sub_skill', 'work_type', 'book_in', 'book_end',
                'description', 'daily_rate', 'total_amount', 'working_days',
                'total_hours', 'hourly_rate', 'salary_explanation',
                'employer_id', 'worker_id', 'is_available',
                'conflict_message', 'conflicting_jobs'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('booking_requests', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('booking_requests', function (Blueprint $table) use ($columnsToDrop) {
                    $table->dropColumn($columnsToDrop);
                });
            }
        }
    }
}

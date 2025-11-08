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
            
            // Drop unnecessary fields (only if they exist)
            $columnsToDrop = [];
            $columns = ['action', 'notes', 'metadata', 'is_available', 'conflict_message', 'conflicting_jobs', 'employer_id', 'worker_id'];
            
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

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('booking_requests')) {
            Schema::table('booking_requests', function (Blueprint $table) {
                // Re-add the columns only if they don't exist
                if (!Schema::hasColumn('booking_requests', 'action')) {
                    $table->enum('action', ['created', 'accepted', 'declined', 'cancelled', 'completed', 'deleted'])->after('user_id');
                }
                if (!Schema::hasColumn('booking_requests', 'notes')) {
                    $table->text('notes')->nullable()->after('action');
                }
                if (!Schema::hasColumn('booking_requests', 'metadata')) {
                    $table->json('metadata')->nullable()->after('notes');
                }
                if (!Schema::hasColumn('booking_requests', 'is_available')) {
                    $table->boolean('is_available')->default(true)->after('salary_explanation');
                }
                if (!Schema::hasColumn('booking_requests', 'conflict_message')) {
                    $table->text('conflict_message')->nullable()->after('is_available');
                }
                if (!Schema::hasColumn('booking_requests', 'conflicting_jobs')) {
                    $table->json('conflicting_jobs')->nullable()->after('conflict_message');
                }
                if (!Schema::hasColumn('booking_requests', 'employer_id')) {
                    $table->unsignedBigInteger('employer_id')->nullable()->after('conflicting_jobs');
                }
                if (!Schema::hasColumn('booking_requests', 'worker_id')) {
                    $table->unsignedBigInteger('worker_id')->nullable()->after('employer_id');
                }
            });
            
            // Re-add foreign key constraints only if columns exist and users table exists
            if (Schema::hasTable('users')) {
                if (Schema::hasColumn('booking_requests', 'employer_id')) {
                    try {
                        Schema::table('booking_requests', function (Blueprint $table) {
                            $table->foreign('employer_id')->references('id')->on('users')->onDelete('cascade');
                        });
                    } catch (\Throwable $e) {
                        // Constraint might already exist, ignore
                    }
                }
                
                if (Schema::hasColumn('booking_requests', 'worker_id')) {
                    try {
                        Schema::table('booking_requests', function (Blueprint $table) {
                            $table->foreign('worker_id')->references('id')->on('users')->onDelete('cascade');
                        });
                    } catch (\Throwable $e) {
                        // Constraint might already exist, ignore
                    }
                }
            }
            
            // Re-add indexes
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->index(['service_type', 'work_type']);
                });
            } catch (\Throwable $e) {
                // Index might already exist, ignore
            }
            
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->index(['book_in', 'book_end']);
                });
            } catch (\Throwable $e) {
                // Index might already exist, ignore
            }
            
            try {
                Schema::table('booking_requests', function (Blueprint $table) {
                    $table->index(['employer_id', 'worker_id']);
                });
            } catch (\Throwable $e) {
                // Index might already exist, ignore
            }
        }
    }
}

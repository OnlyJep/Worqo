<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Database\MigrationSafe;

class RemoveUnnecessaryFieldsFromBookingRequestsTable extends Migration
{
    use MigrationSafe;
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Each operation in its own transaction
        // Step 1: Drop foreign key constraints
        $this->safeDropForeign('booking_requests', 'employer_id');
        $this->safeDropForeign('booking_requests', 'worker_id');
        
        // Step 2: Drop indexes
        $this->safeDropIndex('booking_requests', ['service_type', 'work_type']);
        $this->safeDropIndex('booking_requests', ['book_in', 'book_end']);
        $this->safeDropIndex('booking_requests', ['employer_id', 'worker_id']);
        
        // Step 3: Drop columns
        $this->safeDropColumn('booking_requests', [
            'action', 'notes', 'metadata', 'is_available',
            'conflict_message', 'conflicting_jobs', 'employer_id', 'worker_id'
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Each operation in its own transaction
        // Step 1: Re-add columns
        if (!Schema::hasColumn('booking_requests', 'action')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->string('action')->nullable()->after('user_id');
            });
            $this->safeAddCheckConstraint(
                'booking_requests',
                'action',
                ['created', 'accepted', 'declined', 'cancelled', 'completed', 'deleted'],
                'booking_requests_action_check'
            );
        }
        
        if (!Schema::hasColumn('booking_requests', 'notes')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('action');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'metadata')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->json('metadata')->nullable()->after('notes');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'is_available')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->boolean('is_available')->default(true)->after('salary_explanation');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'conflict_message')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->text('conflict_message')->nullable()->after('is_available');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'conflicting_jobs')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->json('conflicting_jobs')->nullable()->after('conflict_message');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'employer_id')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->unsignedBigInteger('employer_id')->nullable()->after('conflicting_jobs');
            });
        }
        
        if (!Schema::hasColumn('booking_requests', 'worker_id')) {
            $this->safeAddColumn('booking_requests', function (Blueprint $table) {
                $table->unsignedBigInteger('worker_id')->nullable()->after('employer_id');
            });
        }
        
        // Step 2: Re-add foreign key constraints
        $this->safeAddForeign('booking_requests', 'employer_id', 'users', 'id', 'cascade');
        $this->safeAddForeign('booking_requests', 'worker_id', 'users', 'id', 'cascade');
        
        // Step 3: Re-add indexes
        $this->safeAddIndex('booking_requests', ['service_type', 'work_type']);
        $this->safeAddIndex('booking_requests', ['book_in', 'book_end']);
        $this->safeAddIndex('booking_requests', ['employer_id', 'worker_id']);
    }
}

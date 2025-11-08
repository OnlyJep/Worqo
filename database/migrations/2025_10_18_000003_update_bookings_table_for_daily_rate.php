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
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                if (!Schema::hasColumn('bookings', 'daily_rate')) {
                    $table->decimal('daily_rate', 10, 2)->nullable()->after('book_end');
                }
            });
            
            // Drop hourly_rate only if it exists
            if (Schema::hasColumn('bookings', 'hourly_rate')) {
                Schema::table('bookings', function (Blueprint $table) {
                    $table->dropColumn('hourly_rate');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                if (!Schema::hasColumn('bookings', 'hourly_rate')) {
                    $table->decimal('hourly_rate', 10, 2)->nullable()->after('book_end');
                }
            });
            
            // Drop daily_rate only if it exists
            if (Schema::hasColumn('bookings', 'daily_rate')) {
                Schema::table('bookings', function (Blueprint $table) {
                    $table->dropColumn('daily_rate');
                });
            }
        }
    }
};

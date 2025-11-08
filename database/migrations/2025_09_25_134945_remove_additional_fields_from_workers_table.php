<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveAdditionalFieldsFromWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('workers')) {
            $columnsToDrop = [];
            $columns = ['hourly_rate', 'availability_status', 'min_hours_per_week', 'max_hours_per_week', 'timezone', 'profile_completion_percentage', 'last_active_at', 'experience'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('workers', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('workers', function (Blueprint $table) use ($columnsToDrop) {
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
        if (Schema::hasTable('workers')) {
            Schema::table('workers', function (Blueprint $table) {
                if (!Schema::hasColumn('workers', 'hourly_rate')) {
                    $table->decimal('hourly_rate', 10, 2)->nullable();
                }
                if (!Schema::hasColumn('workers', 'availability_status')) {
                    $table->string('availability_status')->nullable();
                }
                if (!Schema::hasColumn('workers', 'min_hours_per_week')) {
                    $table->integer('min_hours_per_week')->nullable();
                }
                if (!Schema::hasColumn('workers', 'max_hours_per_week')) {
                    $table->integer('max_hours_per_week')->nullable();
                }
                if (!Schema::hasColumn('workers', 'timezone')) {
                    $table->string('timezone')->nullable();
                }
                if (!Schema::hasColumn('workers', 'profile_completion_percentage')) {
                    $table->integer('profile_completion_percentage')->nullable();
                }
                if (!Schema::hasColumn('workers', 'last_active_at')) {
                    $table->timestamp('last_active_at')->nullable();
                }
                if (!Schema::hasColumn('workers', 'experience')) {
                    $table->string('experience')->nullable();
                }
            });
        }
    }
}

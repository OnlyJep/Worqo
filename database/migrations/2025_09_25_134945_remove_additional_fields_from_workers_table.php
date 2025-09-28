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
        Schema::table('workers', function (Blueprint $table) {
            $table->dropColumn([
                'hourly_rate',
                'availability_status',
                'min_hours_per_week',
                'max_hours_per_week',
                'timezone',
                'profile_completion_percentage',
                'last_active_at',
                'experience'
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
        Schema::table('workers', function (Blueprint $table) {
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->string('availability_status')->nullable();
            $table->integer('min_hours_per_week')->nullable();
            $table->integer('max_hours_per_week')->nullable();
            $table->string('timezone')->nullable();
            $table->integer('profile_completion_percentage')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->string('experience')->nullable();
        });
    }
}

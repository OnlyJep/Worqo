<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMinMaxPointsToRanksTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('ranks', function (Blueprint $table) {
            // Drop the old required_points column
            $table->dropColumn('required_points');
            // Add new min_points and max_points columns
            $table->integer('min_points')->default(0)->after('image');
            $table->integer('max_points')->nullable()->after('min_points');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ranks', function (Blueprint $table) {
            // Remove the new columns
            $table->dropColumn(['min_points', 'max_points']);
            // Re-add the old required_points column
            $table->integer('required_points')->default(0)->after('image');
        });
    }
}

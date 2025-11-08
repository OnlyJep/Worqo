<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsOnlineToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Check if column already exists before adding
        if (!Schema::hasColumn('users', 'is_online')) {
            Schema::table('users', function (Blueprint $table) {
                // Try to add after last_activity if it exists, otherwise add after updated_at
                if (Schema::hasColumn('users', 'last_activity')) {
                    $table->boolean('is_online')->default(false)->after('last_activity');
                } else {
                    $table->boolean('is_online')->default(false)->after('updated_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasColumn('users', 'is_online')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_online');
            });
        }
    }
}

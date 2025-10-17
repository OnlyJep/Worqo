<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCredentialsPhotoToWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasColumn('workers', 'credentials_photo')) {
            Schema::table('workers', function (Blueprint $table) {
                $table->json('credentials_photo')->nullable()->after('credentials_name');
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
        if (Schema::hasColumn('workers', 'credentials_photo')) {
            Schema::table('workers', function (Blueprint $table) {
                $table->dropColumn('credentials_photo');
            });
        }
    }
}

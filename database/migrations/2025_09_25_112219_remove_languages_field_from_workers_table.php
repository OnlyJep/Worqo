<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveLanguagesFieldFromWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('workers') && Schema::hasColumn('workers', 'languages')) {
            Schema::table('workers', function (Blueprint $table) {
                $table->dropColumn('languages');
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
        if (Schema::hasTable('workers') && !Schema::hasColumn('workers', 'languages')) {
            Schema::table('workers', function (Blueprint $table) {
                $table->json('languages')->nullable();
            });
        }
    }
}

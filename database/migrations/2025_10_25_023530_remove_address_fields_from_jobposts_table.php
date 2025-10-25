<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveAddressFieldsFromJobpostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('jobposts', function (Blueprint $table) {
            $table->dropColumn(['street', 'city', 'province', 'postal_code', 'country']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('jobposts', function (Blueprint $table) {
            $table->string('street')->nullable();
            $table->string('city')->default('Butuan City');
            $table->string('province')->default('Agusan Del Norte');
            $table->string('postal_code')->default('8600');
            $table->string('country')->default('Philippines');
        });
    }
}

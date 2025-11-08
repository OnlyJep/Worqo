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
        if (Schema::hasTable('jobposts')) {
            $columnsToDrop = [];
            $columns = ['street', 'city', 'province', 'postal_code', 'country'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('jobposts', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('jobposts', function (Blueprint $table) use ($columnsToDrop) {
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
        if (Schema::hasTable('jobposts')) {
            Schema::table('jobposts', function (Blueprint $table) {
                if (!Schema::hasColumn('jobposts', 'street')) {
                    $table->string('street')->nullable();
                }
                if (!Schema::hasColumn('jobposts', 'city')) {
                    $table->string('city')->default('Butuan City');
                }
                if (!Schema::hasColumn('jobposts', 'province')) {
                    $table->string('province')->default('Agusan Del Norte');
                }
                if (!Schema::hasColumn('jobposts', 'postal_code')) {
                    $table->string('postal_code')->default('8600');
                }
                if (!Schema::hasColumn('jobposts', 'country')) {
                    $table->string('country')->default('Philippines');
                }
            });
        }
    }
}

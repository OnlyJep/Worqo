<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVerifiedAndRankToWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->boolean('verified')->default(false)->after('is_reviewed');
            $table->foreignId('rank_id')->nullable()->constrained('ranks')->onDelete('set null')->after('verified');
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
            $table->dropForeign(['rank_id']);
            $table->dropColumn(['verified', 'rank_id']);
        });
    }
}

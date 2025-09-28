<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveUnnecessaryFieldsFromWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            // Remove unnecessary fields
            $table->dropColumn([
                'portfolio_links',
                'social_media_links',
                'profile_views_count',
                'applications_count',
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
            // Add back the removed fields
            $table->json('portfolio_links')->nullable();
            $table->json('social_media_links')->nullable();
            $table->integer('profile_views_count')->default(0);
            $table->integer('applications_count')->default(0);
        });
    }
}

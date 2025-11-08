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
        if (Schema::hasTable('workers')) {
            $columnsToDrop = [];
            $columns = ['portfolio_links', 'social_media_links', 'profile_views_count', 'applications_count'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('workers', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                Schema::table('workers', function (Blueprint $table) use ($columnsToDrop) {
                    // Remove unnecessary fields
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
                // Add back the removed fields
                if (!Schema::hasColumn('workers', 'portfolio_links')) {
                    $table->json('portfolio_links')->nullable();
                }
                if (!Schema::hasColumn('workers', 'social_media_links')) {
                    $table->json('social_media_links')->nullable();
                }
                if (!Schema::hasColumn('workers', 'profile_views_count')) {
                    $table->integer('profile_views_count')->default(0);
                }
                if (!Schema::hasColumn('workers', 'applications_count')) {
                    $table->integer('applications_count')->default(0);
                }
            });
        }
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSkillsIdToWorkersTableNew extends Migration
{
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            // Add skills_id as a JSON column before credentials_name
            $table->json('skills_id')->nullable()->after('work_type');
        });
    }

    public function down()
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->dropColumn('skills_id');
        });
    }
}
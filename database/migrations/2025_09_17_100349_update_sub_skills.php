<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class FixInvalidSubSkillsInSkillsTable extends Migration
{
    public function up()
    {
        // Update invalid or empty sub_skills to an empty JSON array
        DB::table('skills')
            ->whereNull('sub_skills')
            ->orWhere('sub_skills', '')
            ->orWhereRaw('sub_skills NOT LIKE \'[%\'')
            ->update(['sub_skills' => '[]']);

        // Optionally set specific sub_skills for known skills
        DB::table('skills')
            ->where('skill_name', 'Virtual Assistant')
            ->update(['sub_skills' => json_encode(['Data Entry', 'Email Management', 'Scheduling'])]);
    }

    public function down()
    {
        // No rollback needed for data cleanup
    }
}
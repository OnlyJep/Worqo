<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixWorkersTable extends Migration
{
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            // Drop unwanted columns
            if (Schema::hasColumn('workers', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
            if (Schema::hasColumn('workers', 'credentials')) {
                $table->dropColumn('credentials');
            }
            if (Schema::hasColumn('workers', 'credentials_photo')) {
                $table->dropColumn('credentials_photo');
            }
            // Ensure correct columns exist
            if (!Schema::hasColumn('workers', 'credentials_name')) {
                $table->json('credentials_name')->nullable()->after('work_type');
            }
            if (!Schema::hasColumn('workers', 'credentials_photo')) {
                $table->json('credentials_photo')->nullable()->after('credentials_name');
            }
            // Ensure other columns match the desired schema
            if (!Schema::hasColumn('workers', 'archived')) {
                $table->boolean('archived')->default(false)->after('credentials_photo');
            }
            if (!Schema::hasColumn('workers', 'work_type')) {
                $table->enum('work_type', ['part-time', 'full-time', 'one-time'])->default('part-time')->after('profile_id');
            }
        });
    }

    public function down()
    {
        Schema::table('workers', function (Blueprint $table) {
            // Revert changes
            if (Schema::hasColumn('workers', 'credentials_name')) {
                $table->dropColumn('credentials_name');
            }
            if (Schema::hasColumn('workers', 'credentials_photo')) {
                $table->dropColumn('credentials_photo');
            }
            // Re-add original credentials_photo for rollback
            $table->json('credentials_photo')->nullable()->after('work_type');
        });
    }
}
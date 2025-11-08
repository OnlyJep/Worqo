<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('jobposts')) {
            $columnsToDrop = [];
            if (Schema::hasColumn('jobposts', 'experience_level')) {
                $columnsToDrop[] = 'experience_level';
            }
            if (Schema::hasColumn('jobposts', 'ranks')) {
                $columnsToDrop[] = 'ranks';
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
     */
    public function down(): void
    {
        if (Schema::hasTable('jobposts')) {
            Schema::table('jobposts', function (Blueprint $table) {
                if (!Schema::hasColumn('jobposts', 'experience_level')) {
                    $table->string('experience_level')->nullable();
                }
                if (!Schema::hasColumn('jobposts', 'ranks')) {
                    $table->json('ranks')->nullable();
                }
            });
        }
    }
};
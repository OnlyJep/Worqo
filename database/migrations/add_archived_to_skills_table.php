<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if column already exists before adding
        if (!Schema::hasColumn('skills', 'archived')) {
            try {
                Schema::table('skills', function (Blueprint $table) {
                    $table->boolean('archived')->default(false);
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error adding archived column to skills table: ' . $e->getMessage());
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('skills', 'archived')) {
            Schema::table('skills', function (Blueprint $table) {
                $table->dropColumn('archived');
            });
        }
    }
};
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
        Schema::table('services', function (Blueprint $table) {
            // Add archived column
            $table->boolean('archived')->default(false)->after('service_img');
            
            // Drop the foreign key constraint and skills_id column
            if (Schema::hasColumn('services', 'skills_id')) {
                $table->dropForeign(['skills_id']);
                $table->dropColumn('skills_id');
            }
            // Add skills_id as a JSON column
            $table->json('skills_id')->nullable()->after('collars_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the service_skill pivot table
        Schema::dropIfExists('service_skill');

        Schema::table('services', function (Blueprint $table) {
            // Remove archived column
            $table->dropColumn('archived');
            
            // Restore skills_id as a foreignId
            if (Schema::hasColumn('services', 'skills_id')) {
                $table->dropColumn('skills_id');
            }
            $table->foreignId('skills_id')->nullable()->constrained('skills')->onDelete('cascade')->after('collars_id');
        });
    }
};
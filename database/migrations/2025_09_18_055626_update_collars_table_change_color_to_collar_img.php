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
        Schema::table('collars', function (Blueprint $table) {
            // Add the new collar_img column first
            $table->string('collar_img')->nullable()->after('color');
            
            // Drop the old color column
            $table->dropColumn('color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collars', function (Blueprint $table) {
            // Add back the color column
            $table->string('color')->nullable()->after('name');
            
            // Drop the collar_img column
            $table->dropColumn('collar_img');
        });
    }
};
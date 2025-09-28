<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEnhancedFieldsToWorkersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('workers', function (Blueprint $table) {
            // Add hourly rate field for general worker rate
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('work_type');
            
            // Add availability status
            $table->enum('availability_status', ['available', 'busy', 'unavailable'])->default('available')->after('hourly_rate');
            
            // Add minimum hours per week
            $table->integer('min_hours_per_week')->nullable()->after('availability_status');
            
            // Add maximum hours per week
            $table->integer('max_hours_per_week')->nullable()->after('min_hours_per_week');
            
            // Add timezone
            $table->string('timezone', 50)->default('Asia/Manila')->after('max_hours_per_week');
            
            // Add preferred working hours
            $table->json('preferred_working_hours')->nullable()->after('timezone');
            
            // Add languages spoken
            $table->json('languages')->nullable()->after('preferred_working_hours');
            
            // Add portfolio links
            $table->json('portfolio_links')->nullable()->after('languages');
            
            // Add social media links
            $table->json('social_media_links')->nullable()->after('portfolio_links');
            
            // Add bio/description
            $table->text('bio')->nullable()->after('social_media_links');
            
            // Add profile completion percentage
            $table->integer('profile_completion_percentage')->default(0)->after('bio');
            
            // Add last active timestamp
            $table->timestamp('last_active_at')->nullable()->after('profile_completion_percentage');
            
            // Add profile views count
            $table->integer('profile_views_count')->default(0)->after('last_active_at');
            
            // Add application count
            $table->integer('applications_count')->default(0)->after('profile_views_count');
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
            $table->dropColumn([
                'hourly_rate',
                'availability_status',
                'min_hours_per_week',
                'max_hours_per_week',
                'timezone',
                'preferred_working_hours',
                'languages',
                'portfolio_links',
                'social_media_links',
                'bio',
                'profile_completion_percentage',
                'last_active_at',
                'profile_views_count',
                'applications_count',
            ]);
        });
    }
}

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
        Schema::create('jobposts', function (Blueprint $table) {
            $table->id();
            // Make company_id nullable for now since companies table might not exist
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('profile_id')->constrained('users')->onDelete('cascade');
            $table->json('skills')->nullable(); // JSON array for skills, automatically cast to array
            $table->json('ranks')->nullable(); // JSON array for ranks, automatically cast to array
            $table->text('description');
            $table->decimal('salary', 10, 2)->nullable();
            $table->enum('job_type', ['full-time', 'part-time', 'contract', 'temporary']);
            $table->enum('hiring_type', ['individual', 'team'])->default('individual');
            $table->string('street')->nullable();
            $table->string('city')->default('Butuan City');
            $table->string('province')->default('Agusan Del Norte');
            $table->string('postal_code')->default('8600');
            $table->string('country')->default('Philippines');
            $table->dateTime('application_start');
            $table->dateTime('application_deadline');
            $table->boolean('archived')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobposts');
    }
};
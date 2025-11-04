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
        Schema::dropIfExists('contractors');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('contractors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('profile_id');
            $table->unsignedBigInteger('user_id');
            $table->string('full_name');
            $table->unsignedBigInteger('gender_id');
            $table->unsignedBigInteger('suffix_id')->nullable();
            $table->string('street');
            $table->string('city');
            $table->string('province');
            $table->string('postal_code');
            $table->string('country');
            $table->json('credentials_name')->nullable();
            $table->json('credentials_photo')->nullable();
            $table->json('credentials_doc')->nullable();
            $table->timestamps();
        });
    }
};


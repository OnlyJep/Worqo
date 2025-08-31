<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('first_name');
            $table->string('middlename')->nullable();
            $table->string('last_name');
            $table->unsignedBigInteger('gender_id');
            $table->unsignedBigInteger('suffix_id')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('street')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->string('profile_img')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('gender_id')->references('id')->on('genders')->onDelete('restrict');
            $table->foreign('suffix_id')->references('id')->on('suffixes')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
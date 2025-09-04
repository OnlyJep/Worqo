<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->json('profile_id'); // JSON array containing CEO and Workers
            $table->string('street');
            $table->string('contact_number');
            $table->string('city');
            $table->string('province');
            $table->integer('postal_code');
            $table->string('country');
            $table->boolean('archived')->default(false); // For archiving functionality
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('companies');
    }
};
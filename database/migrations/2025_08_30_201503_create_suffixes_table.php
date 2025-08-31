<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suffixes', function (Blueprint $table) {
            $table->id();
            $table->string('suffix_name')->unique();
            $table->timestamps();
            $table->boolean('archived')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suffixes');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Recipient of the notification
            $table->unsignedBigInteger('sender_id')->nullable(); // Who triggered the notification
            $table->string('type'); // booking, hiring, review_approval, review_rejection, job_application
            $table->string('title'); // Notification title
            $table->text('message'); // Notification message
            $table->unsignedBigInteger('related_id')->nullable(); // ID of related entity (booking_id, job_id, etc.)
            $table->string('related_type')->nullable(); // Type of related entity (booking, job, etc.)
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');
            
            // Indexes for better query performance
            $table->index('user_id');
            $table->index('is_read');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}

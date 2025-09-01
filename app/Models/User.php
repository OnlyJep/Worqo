<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'role_id',
        'archived',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'archived' => 'boolean',
    ];

    // Relationship with profiles table
    public function profile()
    {
        return $this->hasOne(Profile::class, 'user_id', 'id');
    }

    // Relationship with employers table through profiles
    public function employer()
    {
        return $this->hasOneThrough(
            Employer::class, // Target model
            Profile::class,  // Intermediate model
            'user_id',       // Foreign key on Profile table
            'profile_id',    // Foreign key on Employer table
            'id',            // Local key on User table
            'id'             // Local key on Profile table
        );
    }

    // Relationship with workers table through profiles
    public function worker()
    {
        return $this->hasOneThrough(
            Worker::class,   // Target model
            Profile::class,  // Intermediate model
            'user_id',       // Foreign key on Profile table
            'profile_id',    // Foreign key on Worker table
            'id',            // Local key on User table
            'id'             // Local key on Profile table
        );
    }

    // Relationship with roles table
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }
}
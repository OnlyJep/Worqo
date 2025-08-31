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
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'middlename',
        'last_name',
        'gender_id',
        'suffix_id',
        'contact_number',
        'street',
        'city',
        'province',
        'postal_code',
        'country',
        'profile_img',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationship with users table
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Relationship with genders table
    public function gender()
    {
        return $this->belongsTo(Gender::class, 'gender_id', 'id');
    }

    // Relationship with suffixes table
    public function suffix()
    {
        return $this->belongsTo(Suffix::class, 'suffix_id', 'id');
    }

    // Accessor for profile_img URL
    public function getProfileImgAttribute($value)
    {
        return $value ? Storage::url($value) : null;
    }
}
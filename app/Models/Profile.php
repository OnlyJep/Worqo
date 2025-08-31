<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function gender()
    {
        return $this->belongsTo(Gender::class, 'gender_id');
    }

    public function suffix()
    {
        return $this->belongsTo(Suffix::class, 'suffix_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contractor extends Model
{
    use HasFactory;

    protected $fillable = [
        'profile_id',
        'user_id',
        'full_name',
        'gender_id',
        'suffix_id',
        'street',
        'city',
        'province',
        'postal_code',
        'country',
        'credentials_name',
        'credentials_photo',
        'credentials_doc',
    ];

    protected $casts = [
        'credentials_name' => 'array',
        'credentials_photo' => 'array',
        'credentials_doc' => 'array',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}


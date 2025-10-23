<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employer extends Model
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
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}

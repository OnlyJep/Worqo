<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'profile_id',
        'street',
        'contact_number',
        'city',
        'province',
        'postal_code',
        'country',
        'archived',
    ];

    protected $casts = [
        'profile_id' => 'array', // Automatically cast JSON to array
        'archived' => 'boolean',
    ];
}
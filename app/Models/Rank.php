<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rank extends Model
{
    protected $fillable = ['name', 'image', 'required_reviews', 'archived'];

    protected $casts = [
        'archived' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
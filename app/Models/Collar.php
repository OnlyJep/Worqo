<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collar extends Model
{
    protected $fillable = [
        'name',
        'color',
        'archived',
    ];

    protected $casts = [
        'archived' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
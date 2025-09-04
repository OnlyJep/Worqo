<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $fillable = [
        'profile_id',
        'work_type',
        'skills_id',
        'credentials_name',
        'credentials_photo',
        'archived',
    ];

    protected $casts = [
        'skills_id' => 'array',
        'credentials_name' => 'array',
        'credentials_photo' => 'array',
        'archived' => 'boolean',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}
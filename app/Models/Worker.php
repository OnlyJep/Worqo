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
        'is_reviewed',
        'experience',
    ];

    protected $casts = [
        'skills_id' => 'array',
        'credentials_name' => 'array',
        'credentials_photo' => 'array',
        'archived' => 'boolean',
        'is_reviewed' => 'string',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}
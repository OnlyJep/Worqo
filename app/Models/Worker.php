<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $fillable = [
        'profile_id',
        'work_type',
        'hours_per_day',
        'monthly_salary',
        'preferred_working_days',
        'bio',
        'skills_id',
        'credentials_name',
        'credentials_photo',
        'credentials_doc',
        'archived',
        'is_reviewed',
        'verified',
        'rank_id',
    ];

    protected $casts = [
        'hours_per_day' => 'integer',
        'monthly_salary' => 'decimal:2',
        'preferred_working_days' => 'array',
        'skills_id' => 'array',
        'credentials_name' => 'array',
        'credentials_photo' => 'array',
        'credentials_doc' => 'array',
        'archived' => 'boolean',
        'is_reviewed' => 'string',
        'verified' => 'boolean',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }

    public function rank()
    {
        return $this->belongsTo(Rank::class);
    }
}
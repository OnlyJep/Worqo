<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobPost extends Model
{
    protected $table = 'jobposts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'company_id',
        'profile_id',
        'skills',
        'ranks',
        'description',
        'salary',
        'job_type',
        'street',
        'city',
        'province',
        'postal_code',
        'country',
        'application_start',
        'application_deadline',
        'archived',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'skills' => 'array', // Automatically cast JSON to array
        'ranks' => 'array', // Automatically cast JSON to array
        'salary' => 'decimal:2',
        'application_start' => 'datetime',
        'application_deadline' => 'datetime',
        'archived' => 'boolean',
    ];

    /**
     * Get the company that owns the job post.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * Get the profile that owns the job post.
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }
}
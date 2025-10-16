<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_post_id',
        'worker_id',
        'company_id',
        'status',
        'cover_letter',
        'skills',
        'resume_path',
    ];

    protected $casts = [
        'skills' => 'array',
    ];

    /**
     * Get the job post that owns the application.
     */
    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    /**
     * Get the worker that owns the application.
     */
    public function worker()
    {
        return $this->belongsTo(Profile::class, 'worker_id');
    }

    /**
     * Get the company that owns the application (for team applications).
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
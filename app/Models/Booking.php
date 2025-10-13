<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'worker_id',
        'service_type',
        'work_type',
        'description',
        'book_in',
        'book_end',
        'hourly_rate',
        'total_amount',
        'status'
    ];

    protected $casts = [
        'book_in' => 'datetime',
        'book_end' => 'datetime',
        'hourly_rate' => 'decimal:2',
        'total_amount' => 'decimal:2'
    ];

    // Relationships
    public function employer()
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function worker()
    {
        return $this->belongsTo(User::class, 'worker_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeForWorker($query, $workerId)
    {
        return $query->where('worker_id', $workerId);
    }

    public function scopeForEmployer($query, $employerId)
    {
        return $query->where('employer_id', $employerId);
    }
}

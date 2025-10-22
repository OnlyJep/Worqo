<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'time_in',
        'time_out',
        'daily_rate',
        'total_amount',
        'status'
    ];

    protected $casts = [
        'book_in' => 'datetime',
        'book_end' => 'datetime',
        'daily_rate' => 'decimal:2',
        'total_amount' => 'decimal:2'
    ];

    // Relationships
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'worker_id');
    }

    public function bookingRequests(): HasMany
    {
        return $this->hasMany(BookingRequest::class);
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

    /**
     * Log a booking request action.
     */
    public function logAction(string $action, int $userId, ?string $notes = null, ?array $metadata = null): BookingRequest
    {
        return $this->bookingRequests()->create([
            'user_id' => $userId,
            'service_type' => $this->service_type,
            'sub_skill' => null, // Not available in current booking structure
            'work_type' => $this->work_type,
            'book_in' => $this->book_in,
            'book_end' => $this->book_end,
            'time_in' => $this->time_in,
            'time_out' => $this->time_out,
            'description' => $this->description,
            'daily_rate' => $this->daily_rate,
            'total_amount' => $this->total_amount,
            'working_days' => null, // Will be calculated if needed
            'total_hours' => null, // Will be calculated if needed
            'hourly_rate' => null, // Will be calculated if needed
            'salary_explanation' => "Action: {$action} - {$notes}" // Store action info in explanation
        ]);
    }
}

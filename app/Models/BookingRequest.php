<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'user_id',
        // BookModal form fields
        'service_type',
        'sub_skill',
        'work_type',
        'book_in',
        'book_end',
        'time_in',
        'time_out',
        'description',
        'daily_rate',
        'total_amount',
        'status',
    ];

    protected $casts = [
        'book_in' => 'datetime',
        'book_end' => 'datetime',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'daily_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the booking that this request belongs to.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by booking.
     */
    public function scopeByBooking($query, int $bookingId)
    {
        return $query->where('booking_id', $bookingId);
    }

    /**
     * Scope to filter by service type.
     */
    public function scopeByServiceType($query, string $serviceType)
    {
        return $query->where('service_type', $serviceType);
    }

    /**
     * Scope to filter by work type.
     */
    public function scopeByWorkType($query, string $workType)
    {
        return $query->where('work_type', $workType);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('book_in', [$startDate, $endDate]);
    }

    /**
     * Create a booking request from BookModal form data.
     */
    public static function createFromBookModal(array $bookModalData, int $userId, ?int $bookingId = null): self
    {
        return self::create([
            'booking_id' => $bookingId,
            'user_id' => $userId,
            // BookModal form fields
            'service_type' => $bookModalData['service_type'] ?? null,
            'sub_skill' => $bookModalData['sub_skill'] ?? null,
            'work_type' => $bookModalData['work_type'] ?? null,
            'book_in' => $bookModalData['book_in'] ?? null,
            'book_end' => $bookModalData['book_end'] ?? null,
            'time_in' => $bookModalData['time_in'] ?? null,
            'time_out' => $bookModalData['time_out'] ?? null,
            'description' => $bookModalData['description'] ?? null,
            'daily_rate' => $bookModalData['daily_rate'] ?? null,
            'total_amount' => $bookModalData['total_salary'] ?? null,
            'status' => 'pending', // Default status
        ]);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by pending status.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to filter by accepted status.
     */
    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    /**
     * Scope to filter by declined status.
     */
    public function scopeDeclined($query)
    {
        return $query->where('status', 'declined');
    }

    /**
     * Scope to filter by cancelled status.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope to filter by completed status.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}

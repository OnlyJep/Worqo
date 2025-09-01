<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Worker extends Model
{
    use SoftDeletes;

    protected $table = 'workers';

    protected $fillable = [
        'profile_id',
        'work_type',
        'credentials_photo',
        'archived',
    ];

    protected $casts = [
        'credentials_photo' => 'array',
        'archived' => 'boolean',
    ];

    protected $attributes = [
        'archived' => false,
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id');
    }
}
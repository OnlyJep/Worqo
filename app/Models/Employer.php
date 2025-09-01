<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employer extends Model
{
    use HasFactory;

    protected $fillable = [
        'profile_id',
        'company_name',
        'company_phone',
        'company_email',
        'company_address',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}

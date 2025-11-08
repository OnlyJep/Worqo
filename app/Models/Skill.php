<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['skill_name', 'sub_skills', 'archived'];

    protected $casts = [
        'archived' => 'boolean',
        'sub_skills' => 'array', // Cast JSON to array
    ];

    public function scopeActive($query)
    {
        if (\Illuminate\Support\Facades\Schema::hasColumn('skills', 'archived')) {
            return $query->where('archived', false);
        }
        return $query;
    }

    public function scopeArchived($query)
    {
        if (\Illuminate\Support\Facades\Schema::hasColumn('skills', 'archived')) {
            return $query->where('archived', true);
        }
        return $query->whereRaw('1 = 0'); // Return empty result if column doesn't exist
    }

    public function getNameAttribute()
    {
        return $this->skill_name;
    }

    public function setNameAttribute($value)
    {
        $this->skill_name = $value;
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'description', 'collars_id', 'skills_id', 'service_img', 'archived'];

    public function collar()
    {
        return $this->belongsTo(Collar::class, 'collars_id');
    }
}
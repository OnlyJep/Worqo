<?php

     namespace App\Models;

     use Illuminate\Database\Eloquent\Factories\HasFactory;
     use Illuminate\Database\Eloquent\Model;

     class Skill extends Model
     {
         use HasFactory;

         protected $fillable = ['skill_name', 'archived'];

         protected $casts = [
             'archived' => 'boolean',
         ];

         public function scopeActive($query)
         {
             return $query->where('archived', false);
         }

         public function scopeArchived($query)
         {
             return $query->where('archived', true);
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
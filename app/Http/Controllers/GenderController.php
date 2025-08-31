<?php

namespace App\Http\Controllers;

use App\Models\Gender;
use Illuminate\Http\JsonResponse;

class GenderController extends Controller
{
    public function getGenders(): JsonResponse
    {
        return response()->json(Gender::all(['id', 'gender_name']), 200);
    }
}
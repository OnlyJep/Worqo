<?php

namespace App\Http\Controllers;

use App\Models\Suffix;
use Illuminate\Http\Request;

class SuffixController extends Controller
{
    public function getSuffixes()
    {
        try {
            $suffixes = Suffix::where('archived', false)
                ->get(['id', 'suffix_name', 'created_at', 'updated_at', 'archived']);
            return response()->json($suffixes, 200);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch suffixes: ' . $e->getMessage(), ['trace' => $e->getTrace()]);
            return response()->json([
                'error' => 'Failed to fetch suffixes',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
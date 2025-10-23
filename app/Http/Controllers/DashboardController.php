<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getDashboardStats()
    {
        // Count workers (role_id = 1)
        $totalWorkers = DB::table('users')
            ->where('role_id', 1)
            ->where('archived', 0)
            ->count();

        // Count employers (role_id = 2)
        $totalEmployers = DB::table('users')
            ->where('role_id', 2)
            ->where('archived', 0)
            ->count();

        // Count admins (role_id = 3)
        $totalAdmins = DB::table('users')
            ->where('role_id', 3)
            ->where('archived', 0)
            ->count();

        // Count total users
        $totalUsers = DB::table('users')
            ->where('archived', 0)
            ->count();

        // Count total job postings
        $totalJobPostings = DB::table('jobposts')
            ->where('archived', 0)
            ->count();

        // Count total bookings
        $totalBookings = DB::table('bookings')
            ->count();

        // Calculate Worker and Employer registrations for the last 7 days for the charts
        $startDate = now()->subDays(7)->startOfDay();
        $registrations = DB::table('users')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as workers'),
                DB::raw('SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as employers')
            )
            ->where('archived', 0)
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Format chart data for Workers and Employers separately
        $workerChartData = [
            'labels' => [],
            'data' => [],
        ];
        $employerChartData = [
            'labels' => [],
            'data' => [],
        ];

        // Fill chart data for the last 7 days
        for ($i = 0; $i < 7; $i++) {
            $date = now()->subDays(6 - $i)->format('Y-m-d');
            $workerChartData['labels'][] = $date;
            $employerChartData['labels'][] = $date;
            $record = $registrations->firstWhere('date', $date);
            $workerChartData['data'][] = $record ? $record->workers : 0;
            $employerChartData['data'][] = $record ? $record->employers : 0;
        }

        return response()->json([
            'stats' => [
                'total_workers' => $totalWorkers,
                'total_employers' => $totalEmployers,
                'total_admins' => $totalAdmins,
                'total_users' => $totalUsers,
                'total_job_postings' => $totalJobPostings,
                'total_bookings' => $totalBookings,
            ],
            'worker_chart_data' => $workerChartData,
            'employer_chart_data' => $employerChartData,
        ]);
    }
}
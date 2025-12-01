<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ESP32CommunicationService;
use Inertia\Inertia;
use Inertia\Response;
use Rawilk\Printing\Facades\Printing;

class DashboardController extends Controller
{
    public function __construct(
        protected ESP32CommunicationService $esp32Service
    ) {}

    /**
     * Display admin dashboard.
     */
    public function index(): Response
    {
        // Revenue statistics
        $totalRevenue = round((float) Transaction::where('transaction_type', 'print_deduction')
            ->sum('amount') ?: 0, 2);

        $revenueToday = round((float) Transaction::where('transaction_type', 'print_deduction')
            ->whereDate('created_at', today())
            ->sum('amount') ?: 0, 2);

        // Print job statistics
        $totalPrintJobs = PrintJob::count();
        $printJobsToday = PrintJob::whereDate('created_at', today())->count();
        $activePrintJobs = PrintJob::whereIn('status', ['pending', 'processing', 'printing'])->count();

        // User statistics
        $totalUsers = User::count();

        // ESP32 status
        $esp32Status = $this->esp32Service->getStatus();

        // Printer status - check actual CUPS printer status
        $defaultPrinter = config('printing.default_printer_id');
        $printerStatus = [
            'online' => false,
            'queuedJobs' => PrintJob::where('status', 'pending')->count(),
        ];

        if ($defaultPrinter) {
            try {
                $printer = Printing::printer($defaultPrinter);
                if ($printer) {
                    // If we can retrieve the printer, it's online
                    $printerStatus['online'] = true;
                }
            } catch (\Exception $e) {
                // Printer check failed, leave as offline
                \Log::debug('Failed to check printer status', ['error' => $e->getMessage()]);
            }
        }

        // Recent print jobs
        $recentJobs = PrintJob::with('user')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($job) => [
                'id' => $job->id,
                'fileName' => $job->file_name,
                'status' => $job->status,
                'cost' => (float) $job->cost,
                'createdAt' => $job->created_at->toIso8601String(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'revenueToday' => $revenueToday,
                'totalPrintJobs' => $totalPrintJobs,
                'printJobsToday' => $printJobsToday,
                'activePrintJobs' => $activePrintJobs,
                'totalUsers' => $totalUsers,
                'esp32Status' => $esp32Status,
                'printerStatus' => $printerStatus,
            ],
            'recentJobs' => $recentJobs,
        ]);
    }
}

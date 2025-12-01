<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrintJobResource;
use App\Models\PrintJob;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PrintJobController extends Controller
{
    /**
     * Display paginated list of print jobs.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $perPage = $request->integer('per_page', 15);

        $query = PrintJob::with('user')->latest();

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if ($status) {
            $query->where('status', $status);
        }

        $printJobs = $query->paginate($perPage);

        return Inertia::render('admin/print-jobs', [
            'printJobs' => [
                'data' => $printJobs->map(fn ($job) => [
                    'id' => $job->id,
                    'fileName' => $job->file_name,
                    'userName' => $job->user->name ?? 'Guest',
                    'pages' => $job->pages,
                    'copies' => $job->copies,
                    'colorMode' => $job->color_mode,
                    'cost' => (float) $job->cost,
                    'status' => $job->status,
                    'createdAt' => $job->created_at->toIso8601String(),
                    'completedAt' => $job->completed_at?->toIso8601String(),
                ]),
                'meta' => [
                    'currentPage' => $printJobs->currentPage(),
                    'lastPage' => $printJobs->lastPage(),
                    'perPage' => $printJobs->perPage(),
                    'total' => $printJobs->total(),
                ],
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Display single print job details.
     */
    public function show(PrintJob $printJob): Response
    {
        $printJob->load(['user', 'transactions']);

        return Inertia::render('admin/print-job-detail', [
            'printJob' => (new PrintJobResource($printJob))->resolve(),
        ]);
    }

    /**
     * Export print jobs as CSV.
     */
    public function export(Request $request): HttpResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $query = PrintJob::with('user')->latest();

        // Apply same filters as index
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $printJobs = $query->get();

        // Generate CSV
        $csv = $this->generateCsv($printJobs);

        $filename = 'print_jobs_'.now()->format('Y-m-d_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Generate CSV content from print jobs.
     */
    protected function generateCsv($printJobs): string
    {
        $output = fopen('php://temp', 'r+');

        // Add UTF-8 BOM for proper encoding in Excel
        fwrite($output, "\xEF\xBB\xBF");

        // CSV Headers
        fputcsv($output, [
            'ID',
            'File Name',
            'User Name',
            'User Email',
            'Pages',
            'Copies',
            'Color Mode',
            'Paper Size',
            'Orientation',
            'Cost',
            'Status',
            'Created Date',
            'Created Time',
            'Started Date',
            'Started Time',
            'Completed Date',
            'Completed Time',
            'CUPS Job ID',
            'Error Message',
            'Retry Count',
        ]);

        // CSV Rows
        foreach ($printJobs as $job) {
            fputcsv($output, [
                $job->id,
                $job->file_name,
                $job->user?->name ?? 'Guest',
                $job->user?->email ?? '',
                $job->pages,
                $job->copies,
                $job->color_mode,
                $job->paper_size ?? 'A4',
                $job->orientation ?? 'portrait',
                number_format($job->cost, 2, '.', ''),
                $job->status,
                $job->created_at->format('Y-m-d'),
                $job->created_at->format('H:i:s'),
                $job->started_at ? $job->started_at->format('Y-m-d') : '',
                $job->started_at ? $job->started_at->format('H:i:s') : '',
                $job->completed_at ? $job->completed_at->format('Y-m-d') : '',
                $job->completed_at ? $job->completed_at->format('H:i:s') : '',
                $job->cups_job_id ?? '',
                $job->error_message ?? '',
                $job->retry_count ?? 0,
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}

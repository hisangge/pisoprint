<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitPrintJobRequest;
use App\Models\PrintJob;
use App\Models\User;
use App\Services\CreditManager;
use App\Services\PricingService;
use App\Services\PrintJobManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PrintJobController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected PrintJobManager $printJobManager,
        protected CreditManager $creditManager,
        protected PricingService $pricingService
    ) {}

    /**
     * Display print status page.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $jobId = $request->query('jobId');
        $userId = $request->user()?->id ?? session('guest_user_id');

        // Get print job by ID or latest active job
        if ($jobId) {
            $printJob = PrintJob::find($jobId);
        } else {
            $printJob = PrintJob::where('user_id', $userId)
                ->whereIn('status', ['pending', 'processing', 'printing'])
                ->latest()
                ->first();
        }

        if (! $printJob) {
            return redirect()->route('kiosk.home')->with('error', 'No print job found');
        }

        // Update status from CUPS
        $this->printJobManager->getJobStatus($printJob);
        $printJob->refresh();

        return Inertia::render('kiosk/print-status', [
            // All data lazy-loaded for efficient polling with only: ['printJob']
            // The entire printJob prop is loaded when requested
            'printJob' => fn () => [
                'id' => $printJob->id,
                'fileName' => $printJob->file_name,
                'pages' => $printJob->pages,
                'status' => $printJob->status,
                'currentPage' => $printJob->current_page,
                'errorMessage' => $printJob->error_message,
                'startedAt' => $printJob->started_at?->toIso8601String(),
                'completedAt' => $printJob->completed_at?->toIso8601String(),
                'colorMode' => $printJob->color_mode,
                'copies' => $printJob->copies,
            ],
        ]);
    }

    /**
     * Submit print job after payment complete.
     */
    public function submit(SubmitPrintJobRequest $request): JsonResponse
    {
        $userId = $request->user()?->id ?? session('guest_user_id');
        $uploadInfo = session('upload_info');

        if (! $userId || ! $uploadInfo) {
            return $this->errorResponse(
                'NO_FILE_UPLOADED',
                'No file has been uploaded. Please upload a file first.',
                400
            );
        }

        $colorMode = $request->input('color_mode');
        $copies = $request->input('copies');
        $orientation = $request->input('orientation', 'portrait');

        // Calculate cost using PricingService
        $cost = $this->pricingService->calculateCost(
            $uploadInfo['pages'],
            $copies,
            $colorMode
        );

        // Check balance
        if (! $this->creditManager->hasSufficientBalance($userId, $cost)) {
            return $this->errorResponse(
                'INSUFFICIENT_BALANCE',
                'Insufficient balance for this print job.',
                400,
                [
                    'required' => $cost,
                    'current' => $this->creditManager->getBalance($userId),
                ]
            );
        }

        // Wrap in transaction to ensure atomicity
        try {
            $printJob = DB::transaction(function () use ($userId, $uploadInfo, $cost, $colorMode, $copies, $orientation) {
                // Deduct credits
                $this->creditManager->deductCredits($userId, $cost, 'Print job payment');

                // Submit print job
                return $this->printJobManager->submitJob(
                    userId: $userId,
                    filePath: $uploadInfo['path'],
                    pages: $uploadInfo['pages'],
                    fileName: $uploadInfo['original_name'],
                    fileSize: $uploadInfo['size'],
                    fileType: $uploadInfo['mime_type'],
                    cost: $cost,
                    colorMode: $colorMode,
                    copies: $copies,
                    orientation: $orientation,
                    paymentComplete: true
                );
            });

            // Clear upload session
            session()->forget('upload_info');

            // Reset balance for next job (per-job payment model)
            $this->creditManager->resetSession($userId);

            return response()->json([
                'success' => true,
                'print_job_id' => $printJob->id,
                'message' => 'Print job submitted successfully',
            ]);

        } catch (\Exception $e) {
            // Transaction will auto-rollback, no manual refund needed
            return $this->errorResponse(
                'PRINT_JOB_SUBMISSION_FAILED',
                'Failed to submit print job. Please try again.',
                500,
                ['details' => config('app.debug') ? $e->getMessage() : null]
            );
        }
    }

    /**
     * Get print job status (for polling).
     */
    public function status(Request $request): JsonResponse
    {
        $jobId = $request->query('jobId');

        if (! $jobId) {
            return $this->errorResponse(
                'JOB_ID_REQUIRED',
                'Print job ID is required.',
                400
            );
        }

        $printJob = PrintJob::find($jobId);

        if (! $printJob) {
            return $this->errorResponse(
                'PRINT_JOB_NOT_FOUND',
                'Print job not found.',
                404
            );
        }

        // Update status from CUPS
        $this->printJobManager->getJobStatus($printJob);
        $printJob->refresh();

        return response()->json([
            'id' => $printJob->id,
            'fileName' => $printJob->file_name,
            'pages' => $printJob->pages,
            'status' => $printJob->status,
            'currentPage' => $printJob->current_page,
            'errorMessage' => $printJob->error_message,
            'startedAt' => $printJob->started_at?->toIso8601String(),
            'completedAt' => $printJob->completed_at?->toIso8601String(),
            'colorMode' => $printJob->color_mode,
            'copies' => $printJob->copies,
        ]);
    }

    /**
     * Cancel print job.
     */
    public function cancel(PrintJob $printJob, Request $request): JsonResponse
    {
        // Check if user owns this print job
        $userId = $request->user()?->id ?? session('guest_user_id');
        if ($printJob->user_id !== $userId) {
            return $this->errorResponse(
                'UNAUTHORIZED',
                'You are not authorized to cancel this print job.',
                403
            );
        }

        // Only cancel if still active
        if (! $printJob->isActive()) {
            return $this->errorResponse(
                'JOB_CANNOT_BE_CANCELLED',
                'Print job cannot be cancelled as it is no longer active.',
                400
            );
        }

        try {
            $this->printJobManager->cancelJob($printJob);

            $userId = $request->user()?->id ?? session('guest_user_id');

            // Refund credits if not yet printed
            if ($printJob->status === 'pending') {
                $this->creditManager->addCredits(
                    $userId,
                    $printJob->cost,
                    'Print job cancelled - refund',
                    $printJob->id
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Print job cancelled',
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'PRINT_JOB_CANCELLATION_FAILED',
                'Failed to cancel print job. Please try again.',
                500,
                ['details' => config('app.debug') ? $e->getMessage() : null]
            );
        }
    }

    /**
     * Get print history for current user.
     */
    public function history(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?? session('guest_user_id');

        $printJobs = PrintJob::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'print_jobs' => $printJobs,
        ]);
    }

    /**
     * Generate a standardized error response.
     *
     * @param  string  $errorCode  Machine-readable error code
     * @param  string  $message  Human-readable error message
     * @param  int  $statusCode  HTTP status code
     * @param  array  $additionalData  Additional error context
     * @return JsonResponse Standardized error response
     */
    protected function errorResponse(
        string $errorCode,
        string $message,
        int $statusCode = 400,
        array $additionalData = []
    ): JsonResponse {
        return response()->json(array_merge([
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ], $additionalData), $statusCode);
    }
}

<?php

namespace App\Jobs;

use App\Models\PrintJob;
use App\Services\PrintJobManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdatePrintJobStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Delete the job if its models no longer exist.
     */
    public bool $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public PrintJob $printJob
    ) {}

    /**
     * Execute the job.
     */
    public function handle(PrintJobManager $printJobManager): void
    {
        // Skip if job is already in terminal state
        if (in_array($this->printJob->status, ['completed', 'failed', 'cancelled'])) {
            Log::debug('Skipping status update for terminal state job', [
                'job_id' => $this->printJob->id,
                'status' => $this->printJob->status,
            ]);

            return;
        }

        // Skip if no CUPS job ID
        if (empty($this->printJob->cups_job_id)) {
            Log::warning('Cannot update job status without CUPS job ID', [
                'job_id' => $this->printJob->id,
            ]);

            return;
        }

        try {
            Log::debug('Updating print job status from CUPS', [
                'job_id' => $this->printJob->id,
                'cups_job_id' => $this->printJob->cups_job_id,
            ]);

            $printJobManager->updateJobStatus($this->printJob);

            $this->printJob->refresh();

            Log::info('Print job status updated', [
                'job_id' => $this->printJob->id,
                'status' => $this->printJob->status,
            ]);

            // If job is still active, schedule another check in 10 seconds
            if (in_array($this->printJob->status, ['printing', 'submitting'])) {
                static::dispatch($this->printJob)->delay(now()->addSeconds(10));
            }

        } catch (\Exception $e) {
            Log::error('Failed to update print job status', [
                'job_id' => $this->printJob->id,
                'error' => $e->getMessage(),
            ]);

            // Don't fail the job, just log the error
            // CUPS might be temporarily unavailable
        }
    }
}

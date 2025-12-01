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
use Rawilk\Printing\Facades\Printing;

class SubmitPrintJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

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
        try {
            Log::info('Processing print job submission', [
                'job_id' => $this->printJob->id,
                'attempt' => $this->attempts(),
            ]);

            // Update status to submitting
            $this->printJob->update(['status' => 'submitting']);

            // Prepare print task using rawilk/laravel-printing
            $printTask = Printing::newPrintTask()
                ->file($this->printJob->file_path)
                ->printer($this->printJob->printer_name)
                ->copies($this->printJob->copies)
                ->option('PageSize', config('printing.paper_size', 'Letter'))
                ->option('print-scaling', 'auto');

            // Handle Orientation
            if ($this->printJob->orientation === 'landscape') {
                $printTask->option('orientation-requested', '4');
            } else {
                $printTask->option('orientation-requested', '3');
            }

            // Handle Color Mode (verified with lpoptions -l)
            if ($this->printJob->color_mode === 'bw' || $this->printJob->color_mode === 'grayscale') {
                $printTask->option('ColorModel', 'Gray');
            } elseif ($this->printJob->color_mode === 'color') {
                $printTask->option('ColorModel', 'RGB');
            }

            // Set print quality
            $printTask->option('cupsPrintQuality', 'Normal');

            // Submit to printer via rawilk/laravel-printing
            $printJob = $printTask->send();
            $cupsJobId = $printJob->id();

            // Update job with CUPS ID and status
            $this->printJob->update([
                'cups_job_id' => $cupsJobId,
                'status' => 'printing',
                'started_at' => now(),
            ]);

            Log::info('Print job submitted successfully via rawilk/laravel-printing', [
                'job_id' => $this->printJob->id,
                'cups_job_id' => $cupsJobId,
            ]);

        } catch (\Exception $e) {
            Log::error('Print job submission failed', [
                'job_id' => $this->printJob->id,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            // Update job status to failed
            $this->printJob->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Print job permanently failed after all retries', [
            'job_id' => $this->printJob->id,
            'error' => $exception->getMessage(),
        ]);

        $this->printJob->update([
            'status' => 'failed',
            'error_message' => 'Failed after '.$this->tries.' attempts: '.$exception->getMessage(),
            'completed_at' => now(),
        ]);
    }
}

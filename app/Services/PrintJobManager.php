<?php

namespace App\Services;

use App\Events\PrintJobCompleted;
use App\Exceptions\PaymentIncompleteException;
use App\Exceptions\PrintJobSubmissionException;
use App\Models\PrintJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Rawilk\Printing\Facades\Printing;

class PrintJobManager
{
    public function __construct(
        protected PricingService $pricingService
    ) {}

    public function submitJob(
        int $userId,
        string $filePath,
        int $pages,
        ?string $fileName = null,
        ?int $fileSize = null,
        ?string $fileType = null,
        ?float $cost = null,
        string $colorMode = 'bw',
        int $copies = 1,
        string $orientation = 'portrait',
        bool $paymentComplete = true
    ): PrintJob {
        if (! $paymentComplete) {
            throw new PaymentIncompleteException('Cannot submit job without complete payment');
        }

        if ($cost === null) {
            $cost = $this->pricingService->calculateCost($pages, $copies, $colorMode);
        }

        // Get printer name - use default or auto-detect first available
        $printerName = $this->getAvailablePrinter();

        $job = PrintJob::create([
            'user_id' => $userId,
            'file_name' => $fileName ?? basename($filePath),
            'file_path' => $filePath,
            'file_size' => $fileSize ?? filesize($filePath),
            'file_type' => $fileType ?? 'application/pdf',
            'pages' => $pages,
            'cost' => $cost,
            'status' => 'submitting',
            'color_mode' => $colorMode,
            'copies' => $copies,
            'orientation' => $orientation,
            'printer_name' => $printerName,
            'created_at' => now(),
        ]);

        try {
            // --- NATIVE COMMAND GENERATION ---
            $command = ['lp'];

            // Destination
            $command[] = '-d';
            $command[] = $printerName;

            // Copies
            $command[] = '-n';
            $command[] = (string) $copies;

            // Media Size (Letter/A4)
            $command[] = '-o';
            $command[] = 'media='.config('printing.paper_size', 'Letter');

            // Fit to Page (Prevents cropping)
            $command[] = '-o';
            $command[] = 'fit-to-page';

            // Color Mode (Standard CUPS options)
            if ($colorMode === 'bw' || $colorMode === 'grayscale') {
                $command[] = '-o';
                $command[] = 'ColorModel=Gray';
            } else {
                $command[] = '-o';
                $command[] = 'ColorModel=RGB';
            }

            // Orientation (3=Portrait, 4=Landscape)
            $orientValue = ($orientation === 'landscape') ? '4' : '3';
            $command[] = '-o';
            $command[] = "orientation-requested={$orientValue}";

            // The File
            $command[] = $filePath;

            // Log exact command for transparency
            Log::info('Submitting native print command', ['command' => implode(' ', $command)]);

            // EXECUTE
            $result = Process::run($command);

            // Check for system errors
            if ($result->failed()) {
                throw new \Exception('LP Error: '.$result->errorOutput());
            }

            // Capture the Job ID (e.g. "request id is Brother-55")
            $output = $result->output();
            preg_match('/request id is [\w-]+-(\d+)/', $output, $matches);
            $cupsJobId = $matches[1] ?? null;

            // Success Update
            $job->update([
                'cups_job_id' => $cupsJobId,
                'status' => 'printing',
                'started_at' => now(),
            ]);

            Log::info('Print success', ['cups_id' => $cupsJobId]);

        } catch (\Exception $e) {
            $job->update([
                'status' => 'failed',
                'error_message' => 'System Error: '.$e->getMessage(),
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            Log::error('Print Failed', ['error' => $e->getMessage()]);
            throw new PrintJobSubmissionException('Printer error: '.$e->getMessage());
        }

        return $job;
    }

    public function getJobStatus(PrintJob $job): string
    {
        if (empty($job->cups_job_id)) {
            return $job->status;
        }
        if (in_array($job->status, ['completed', 'failed', 'cancelled'])) {
            return $job->status;
        }

        try {
            // Check queue for this specific job ID
            $result = Process::run(['lpstat', '-W', 'not-completed', '-o']);
            $output = $result->output();

            // If the Job ID is NOT in the queue, it finished successfully
            if (strpos($output, "-{$job->cups_job_id} ") === false) {
                if ($job->status === 'printing') {
                    $job->update(['status' => 'completed', 'completed_at' => now()]);
                    PrintJobCompleted::dispatch($job->fresh());
                }
            }
        } catch (\Exception $e) {
        }

        return $job->refresh()->status;
    }

    public function cancelJob(PrintJob $job): void
    {
        if ($job->cups_job_id) {
            try {
                Process::run(['cancel', (string) $job->cups_job_id]);
            } catch (\Exception $e) {
            }
        }
        $job->update(['status' => 'cancelled', 'completed_at' => now()]);
    }

    public function retryJob(PrintJob $job, int $max = 3): bool
    {
        return false;
    }

    public function updateJobStatus(PrintJob $job): void
    {
        $this->getJobStatus($job);
    }

    /**
     * Get an available printer - uses configured default if online, otherwise auto-detects.
     *
     * @throws PrintJobSubmissionException when no printer is available
     */
    protected function getAvailablePrinter(): string
    {
        $defaultPrinter = config('printing.default_printer_id');

        try {
            $printers = Printing::printers();
            $onlinePrinters = [];
            $defaultPrinterOnline = false;

            // Check all printers and their status
            foreach ($printers as $printer) {
                if ($printer->isOnline()) {
                    $onlinePrinters[] = $printer;

                    // Check if default printer is online
                    if ($defaultPrinter && $printer->id() === $defaultPrinter) {
                        $defaultPrinterOnline = true;
                    }
                }
            }

            // If default printer is configured and online, use it
            if ($defaultPrinter && $defaultPrinterOnline) {
                Log::debug('Using configured default printer (online)', ['printer' => $defaultPrinter]);

                return $defaultPrinter;
            }

            // Default printer is offline or not configured - use first available online printer
            if (count($onlinePrinters) > 0) {
                $selectedPrinter = $onlinePrinters[0]->id();

                if ($defaultPrinter) {
                    Log::warning('Default printer offline, using alternative', [
                        'default' => $defaultPrinter,
                        'selected' => $selectedPrinter,
                    ]);
                } else {
                    Log::info('Auto-selected online printer', ['printer' => $selectedPrinter]);
                }

                return $selectedPrinter;
            }

            // No online printers - fall back to default if configured (might come online)
            if ($defaultPrinter) {
                Log::warning('No online printers available, using configured default', ['printer' => $defaultPrinter]);

                return $defaultPrinter;
            }

            // Last resort - use any available printer
            if (count($printers) > 0) {
                $firstPrinter = $printers[0]->id();
                Log::warning('No online printers, using first available', ['printer' => $firstPrinter]);

                return $firstPrinter;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check printer status', ['error' => $e->getMessage()]);

            // If we can't check status but have a default configured, use it
            if ($defaultPrinter) {
                return $defaultPrinter;
            }
        }

        throw new PrintJobSubmissionException('No printer available. Please configure a default printer in settings.');
    }
}

<?php

namespace App\Console\Commands;

use App\Events\PrintJobCompleted;
use App\Models\PrintJob;
use App\Services\CreditManager;
use App\Services\PrintJobManager;
use Illuminate\Console\Command;
use Rawilk\Printing\Facades\Printing;

class MonitorPrintJobs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'print:monitor
                            {--interval=2 : Polling interval in seconds}';

    /**
     * The console command description.
     */
    protected $description = 'Monitor active print jobs and update their status';

    /**
     * Execute the console command.
     */
    public function handle(PrintJobManager $printJobManager, CreditManager $creditManager): void
    {
        $interval = (int) $this->option('interval');

        $this->info("Starting print job monitor (polling every {$interval} seconds)...");
        $this->info('Press Ctrl+C to stop');

        while (true) {
            $this->monitorJobs($printJobManager, $creditManager);
            sleep($interval);
        }
    }

    /**
     * Monitor all active print jobs
     */
    protected function monitorJobs(PrintJobManager $printJobManager, CreditManager $creditManager): void
    {
        $activeJobs = PrintJob::whereIn('status', ['pending', 'printing', 'processing', 'submitting'])
            ->get();

        if ($activeJobs->isEmpty()) {
            return;
        }

        $this->info('Monitoring '.$activeJobs->count().' active jobs...');

        foreach ($activeJobs as $job) {
            try {
                // Use PrintJobManager to get updated status
                $newStatus = $printJobManager->getJobStatus($job);

                if ($newStatus !== $job->status) {
                    $this->line("Job {$job->id} status changed: {$job->status} → {$newStatus}");

                    if ($newStatus === 'completed') {
                        $this->info("✓ Job {$job->id} completed successfully");
                        PrintJobCompleted::dispatch($job->fresh());
                    }

                    if (in_array($newStatus, ['failed', 'cancelled', 'aborted'])) {
                        // Job failed - refund credits
                        $job->update([
                            'status' => 'failed',
                            'completed_at' => now(),
                        ]);

                        $creditManager->addCredits(
                            userId: $job->user_id,
                            amount: $job->cost,
                            description: "Refund for failed print job #{$job->id}"
                        );

                        $this->warn("✗ Job {$job->id} failed - credits refunded");
                    }
                }

            } catch (\Exception $e) {
                $this->error("Error monitoring job {$job->id}: ".$e->getMessage());
            }
        }
    }
}

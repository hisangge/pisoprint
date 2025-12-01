<?php

namespace App\Console\Commands;

use App\Models\PrintJob;
use App\Services\PrintJobManager;
use Illuminate\Console\Command;

class MonitorPrintJobsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'print-jobs:monitor 
                            {--once : Run once instead of continuously}
                            {--interval=5 : Polling interval in seconds}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor active print jobs and update their status from CUPS';

    protected bool $shouldStop = false;

    /**
     * Execute the console command.
     */
    public function handle(PrintJobManager $printJobManager): int
    {
        $once = $this->option('once');
        $interval = (int) $this->option('interval');

        $this->info('Starting print job monitor...');

        // Handle graceful shutdown
        if (! $once) {
            pcntl_signal(SIGTERM, fn () => $this->shouldStop = true);
            pcntl_signal(SIGINT, fn () => $this->shouldStop = true);
        }

        $jobsProcessed = 0;

        do {
            if (! $once) {
                pcntl_signal_dispatch();
            }

            // Get active print jobs
            $activeJobs = PrintJob::whereIn('status', ['pending', 'processing', 'printing'])
                ->get();

            if ($activeJobs->isEmpty()) {
                if ($once) {
                    $this->info('No active print jobs to monitor.');

                    return Command::SUCCESS;
                }
            } else {
                $this->line(sprintf(
                    '[%s] Monitoring %d active job(s)...',
                    now()->format('H:i:s'),
                    $activeJobs->count()
                ));

                foreach ($activeJobs as $job) {
                    try {
                        $oldStatus = $job->status;
                        $printJobManager->updateJobStatus($job);
                        $job->refresh();

                        if ($oldStatus !== $job->status) {
                            $this->info(sprintf(
                                '  Job #%d: %s → %s (Page %d/%d)',
                                $job->id,
                                $oldStatus,
                                $job->status,
                                $job->current_page ?? 0,
                                $job->pages * $job->copies
                            ));
                        }

                        $jobsProcessed++;

                    } catch (\Exception $e) {
                        $this->error(sprintf(
                            '  Job #%d: Error - %s',
                            $job->id,
                            $e->getMessage()
                        ));
                    }
                }
            }

            if (! $once && ! $this->shouldStop) {
                sleep($interval);
            }

        } while (! $once && ! $this->shouldStop);

        if (! $once) {
            $this->newLine();
            $this->info('Print job monitor stopped.');
            $this->info("Total job updates processed: {$jobsProcessed}");
        }

        return Command::SUCCESS;
    }
}

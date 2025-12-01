<?php

namespace App\Console\Commands;

use App\Services\ESP32CommunicationService;
use Illuminate\Console\Command;

class ESP32ListenerCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'esp32:listen 
                            {--port=/dev/ttyUSB0 : Serial port to connect to}
                            {--baud=115200 : Baud rate for serial communication}
                            {--interval=100 : Polling interval in milliseconds}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Listen for coin insertion events from ESP32 via serial port';

    protected bool $shouldStop = false;

    /**
     * Execute the console command.
     */
    public function handle(ESP32CommunicationService $esp32Service): int
    {
        $port = $this->option('port');
        $baudRate = (int) $this->option('baud');
        $interval = (int) $this->option('interval');

        $this->info("Starting ESP32 listener on {$port} at {$baudRate} baud...");

        // Handle graceful shutdown
        pcntl_signal(SIGTERM, fn () => $this->shouldStop = true);
        pcntl_signal(SIGINT, fn () => $this->shouldStop = true);

        // Connect to ESP32
        if (! $esp32Service->connect($port, $baudRate)) {
            $this->error('Failed to connect to ESP32');

            return Command::FAILURE;
        }

        $this->info('ESP32 connected successfully');
        $this->info('Listening for coin insertions... (Press Ctrl+C to stop)');

        $messagesProcessed = 0;

        // Main listening loop
        while (! $this->shouldStop) {
            pcntl_signal_dispatch();

            // Read and process messages
            $messages = $esp32Service->readMessages();

            if (! empty($messages)) {
                $messagesProcessed += count($messages);
                $this->line(sprintf(
                    '[%s] Processed %d message(s) - Total: %d',
                    now()->format('H:i:s'),
                    count($messages),
                    $messagesProcessed
                ));
            }

            // Check health periodically
            if ($messagesProcessed % 100 === 0) {
                $status = $esp32Service->getStatus();
                if (! $status['healthy']) {
                    $this->warn('ESP32 health check failed - no recent heartbeat');
                }
            }

            // Sleep for the specified interval
            usleep($interval * 1000);
        }

        // Cleanup
        $this->newLine();
        $this->info('Shutting down ESP32 listener...');
        $esp32Service->disconnect();
        $this->info("Total messages processed: {$messagesProcessed}");

        return Command::SUCCESS;
    }
}

<?php

namespace App\Services;

use App\Http\Controllers\PaymentController;
use App\Services\ESP32\ESP32ConnectionManager;
use App\Services\ESP32\ESP32HealthMonitor;
use App\Services\ESP32\ESP32MessageParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Main ESP32 communication service that orchestrates message handling.
 *
 * This service uses smaller, focused services:
 * - ESP32ConnectionManager: Handles serial port connection
 * - ESP32MessageParser: Parses and validates messages
 * - ESP32HealthMonitor: Monitors heartbeat and health status
 */
class ESP32CommunicationService
{
    /**
     * Create a new ESP32 communication service instance.
     */
    public function __construct(
        protected ESP32ConnectionManager $connection,
        protected ESP32MessageParser $parser,
        protected ESP32HealthMonitor $health,
        protected PaymentController $paymentController
    ) {}

    /**
     * Connect to ESP32 via serial port.
     *
     * @param  string  $port  Serial port path
     * @param  int  $baudRate  Baud rate
     * @return bool True if connected successfully
     */
    public function connect(string $port = '/dev/ttyUSB0', int $baudRate = 115200): bool
    {
        return $this->connection->connect($port, $baudRate);
    }

    /**
     * Disconnect from ESP32.
     */
    public function disconnect(): void
    {
        $this->connection->disconnect();
    }

    /**
     * Read and process incoming messages from ESP32.
     *
     * Should be called in a loop or scheduled task.
     *
     * @return array Array of processed messages
     */
    public function readMessages(): array
    {
        if (! $this->connection->isConnected()) {
            return [];
        }

        // Read raw data
        $buffer = $this->connection->readRaw();

        if (empty($buffer)) {
            return [];
        }

        // Parse messages
        $messages = $this->parser->parseBuffer($buffer);

        // Process each message
        foreach ($messages as $message) {
            $this->handleMessage($message);
        }

        return $messages;
    }

    /**
     * Handle a parsed message from ESP32 hardware.
     *
     * Routes incoming messages to appropriate handlers based on message type.
     * Updates health monitoring statistics for each message received.
     *
     * @param  array  $message  Parsed message data with 'type' and additional fields
     */
    protected function handleMessage(array $message): void
    {
        $this->health->incrementMessageCount();

        if ($message['type'] === 'COIN') {
            $this->handleCoinInsertion($message['amount']);
        } elseif ($message['type'] === 'STATUS') {
            $this->handleStatusUpdate($message['status']);
        } elseif ($message['type'] === 'ERROR') {
            $this->handleError($message['message']);
        } elseif ($message['type'] === 'HEARTBEAT') {
            $this->handleHeartbeat();
        }
    }

    /**
     * Handle coin insertion event from ESP32.
     *
     * Processes coin insertion by calling the payment controller, updates the
     * ESP32 with acknowledgment or rejection, and logs the transaction.
     *
     * @param  float  $amount  Coin value in Philippine Pesos
     */
    protected function handleCoinInsertion(float $amount): void
    {
        Log::info('Coin inserted', [
            'value' => $amount,
            'esp32_id' => $this->connection->getEsp32Id(),
        ]);

        // Create request for payment controller
        $request = Request::create('/api/payment/coin', 'POST', [
            'amount' => $amount,
            'coin_value' => $amount,
            'esp32_id' => $this->connection->getEsp32Id(),
        ]);

        try {
            // Process coin insertion through payment controller
            $response = $this->paymentController->processCoinInsertion($request);

            $responseData = json_decode($response->getContent(), true);

            if ($responseData['success'] ?? false) {
                // Send acknowledgment back to ESP32
                $this->sendMessage("ACK:COIN:{$amount}");

                Log::info('Coin insertion processed successfully', [
                    'value' => $amount,
                    'new_balance' => $responseData['balance'] ?? 0,
                ]);
            } else {
                $this->sendMessage("NAK:COIN:{$amount}");
                Log::error('Coin insertion processing failed', ['response' => $responseData]);
            }

        } catch (\Exception $e) {
            $this->sendMessage('ERROR:COIN_PROCESSING');
            Log::error('Exception processing coin insertion', [
                'error' => $e->getMessage(),
                'value' => $amount,
            ]);
        }
    }

    /**
     * Handle status update from ESP32.
     *
     * @param  string  $status  Status message
     */
    protected function handleStatusUpdate(string $status): void
    {
        Log::debug('ESP32 status update', ['status' => $status]);
        $this->health->updateStatus($status);
    }

    /**
     * Handle error message from ESP32.
     *
     * @param  string  $error  Error message
     */
    protected function handleError(string $error): void
    {
        Log::error('ESP32 reported error', [
            'error' => $error,
            'esp32_id' => $this->connection->getEsp32Id(),
        ]);
    }

    /**
     * Handle heartbeat message.
     */
    protected function handleHeartbeat(): void
    {
        $this->health->updateHeartbeat();
        $this->sendMessage('ACK:HEARTBEAT');
    }

    /**
     * Send message to ESP32.
     *
     * @param  string  $message  Message to send
     * @return bool True if sent successfully
     */
    public function sendMessage(string $message): bool
    {
        return $this->connection->send($message);
    }

    /**
     * Check if ESP32 is connected and responsive.
     *
     * @return bool True if healthy
     */
    public function isHealthy(): bool
    {
        return $this->connection->isConnected() && $this->health->isHealthy();
    }

    /**
     * Get ESP32 status information.
     *
     * @return array{connected: bool, healthy: bool, esp32_id: string, last_status: string|null, last_heartbeat: string|null}
     */
    public function getStatus(): array
    {
        return [
            'connected' => $this->connection->isConnected(),
            'healthy' => $this->isHealthy(),
            'esp32_id' => $this->connection->getEsp32Id(),
            'last_status' => $this->health->getStatus(),
            'last_heartbeat' => $this->health->getLastHeartbeat()?->format('c'),
        ];
    }

    /**
     * Check if connected.
     *
     * @return bool True if connected
     */
    public function isConnected(): bool
    {
        return $this->connection->isConnected();
    }

    /**
     * Get message count.
     *
     * @return int Message count
     */
    public function getMessageCount(): int
    {
        return $this->health->getMessageCount();
    }

    /**
     * Reset message count.
     */
    public function resetMessageCount(): void
    {
        $this->health->resetMessageCount();
    }
}

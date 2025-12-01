<?php

namespace App\Services\ESP32;

use Illuminate\Support\Facades\Log;

/**
 * Parses and validates messages from ESP32.
 */
class ESP32MessageParser
{
    /**
     * Parse a raw message from ESP32.
     *
     * Expected formats:
     * - "COIN:5.00" - Coin insertion
     * - "STATUS:READY" - Status update
     * - "ERROR:message" - Error message
     * - "HEARTBEAT" - Heartbeat signal
     *
     * @param  string  $message  Raw message from ESP32
     * @return array{type: string, amount?: float, status?: string, message?: string}|null Parsed message or null if invalid
     */
    public function parse(string $message): ?array
    {
        Log::debug('ESP32 message received', ['message' => $message]);

        // Parse message
        $parts = explode(':', $message, 2);

        if (count($parts) < 1) {
            Log::warning('Invalid ESP32 message format', ['message' => $message]);

            return null;
        }

        $command = strtoupper($parts[0]);
        $data = $parts[1] ?? '';

        // Handle HEARTBEAT without data
        if ($command === 'HEARTBEAT') {
            return ['type' => 'HEARTBEAT'];
        }

        if (empty($data) && $command !== 'HEARTBEAT') {
            Log::warning('Invalid ESP32 message format', ['message' => $message]);

            return null;
        }

        $result = match ($command) {
            'COIN' => $this->parseCoinMessage($data),
            'STATUS' => ['type' => 'STATUS', 'status' => $data],
            'ERROR' => ['type' => 'ERROR', 'message' => $data],
            default => null,
        };

        if ($result === null) {
            Log::warning('Unknown ESP32 command', ['command' => $command, 'data' => $data]);
        }

        return $result;
    }

    /**
     * Parse coin message and validate amount.
     *
     * @param  string  $data  Raw coin value from ESP32
     * @return array{type: string, amount: float}|null Parsed coin data or null if invalid
     */
    protected function parseCoinMessage(string $data): ?array
    {
        $amount = filter_var($data, FILTER_VALIDATE_FLOAT);

        if ($amount === false || $amount <= 0 || $amount > 100) {
            Log::warning('Invalid coin amount', ['data' => $data]);

            return null;
        }

        return ['type' => 'COIN', 'amount' => $amount];
    }

    /**
     * Parse buffer containing multiple messages.
     *
     * @param  string  $buffer  Raw buffer data
     * @return array Array of parsed messages
     */
    public function parseBuffer(string $buffer): array
    {
        $lines = explode("\n", trim($buffer));
        $messages = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (! empty($line)) {
                $parsed = $this->parse($line);
                if ($parsed !== null) {
                    $messages[] = $parsed;
                }
            }
        }

        return $messages;
    }

    /**
     * Format message for sending to ESP32.
     *
     * @param  string  $message  Message to format
     * @return string Formatted message with newline
     */
    public function formatMessage(string $message): string
    {
        return trim($message)."\n";
    }
}

<?php

namespace App\Services\ESP32;

use App\Exceptions\SerialPortException;
use Illuminate\Support\Facades\Log;

/**
 * Handles ESP32 serial port connection and low-level communication.
 */
class ESP32ConnectionManager
{
    protected $serialPort;

    protected bool $isConnected = false;

    protected string $esp32Id;

    /**
     * Create a new connection manager instance.
     */
    public function __construct()
    {
        $this->esp32Id = config('hardware.esp32_id', 'ESP32_COIN_001');
    }

    /**
     * Open connection to ESP32 via serial port.
     *
     * @param  string  $port  Serial port path (e.g., /dev/ttyUSB0)
     * @param  int  $baudRate  Baud rate for communication
     * @return bool True if connection successful
     *
     * @throws SerialPortException If connection fails
     */
    public function connect(string $port = '/dev/ttyUSB0', int $baudRate = 115200): bool
    {
        try {
            // Check if port exists
            if (! file_exists($port)) {
                Log::error("Serial port not found: {$port}");

                return false;
            }

            // Configure serial port using stty
            $configCommand = sprintf(
                'stty -F %s %d cs8 -cstopb -parenb raw',
                escapeshellarg($port),
                $baudRate
            );

            exec($configCommand, $output, $returnCode);

            if ($returnCode !== 0) {
                Log::error("Failed to configure serial port: {$port}");

                return false;
            }

            // Open port for reading
            $this->serialPort = fopen($port, 'r+');

            if (! $this->serialPort) {
                Log::error("Failed to open serial port: {$port}");

                return false;
            }

            // Set non-blocking mode
            stream_set_blocking($this->serialPort, false);

            $this->isConnected = true;
            Log::info("ESP32 connected on port: {$port}");

            return true;

        } catch (\Exception $e) {
            Log::error('ESP32 connection error', [
                'error' => $e->getMessage(),
                'port' => $port,
            ]);

            return false;
        }
    }

    /**
     * Disconnect from ESP32.
     */
    public function disconnect(): void
    {
        if ($this->serialPort && $this->isConnected) {
            fclose($this->serialPort);
            $this->isConnected = false;
            Log::info('ESP32 disconnected');
        }
    }

    /**
     * Read raw data from serial port.
     *
     * @return string Raw data read from port
     */
    public function readRaw(): string
    {
        if (! $this->isConnected || ! $this->serialPort) {
            return '';
        }

        $buffer = '';
        while (($char = fgetc($this->serialPort)) !== false) {
            $buffer .= $char;
        }

        return $buffer;
    }

    /**
     * Send raw message to ESP32.
     *
     * @param  string  $message  Message to send
     * @return bool True if message sent successfully
     */
    public function send(string $message): bool
    {
        if (! $this->isConnected || ! $this->serialPort) {
            Log::warning('Cannot send message: ESP32 not connected');

            return false;
        }

        try {
            $message = trim($message)."\n";
            $written = fwrite($this->serialPort, $message);

            if ($written === false || $written === 0) {
                Log::error('Failed to write to serial port');

                return false;
            }

            Log::debug('Message sent to ESP32', ['message' => trim($message)]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error sending message to ESP32', [
                'error' => $e->getMessage(),
                'message' => $message,
            ]);

            return false;
        }
    }

    /**
     * Check if ESP32 is connected.
     *
     * @return bool True if connected
     */
    public function isConnected(): bool
    {
        return $this->isConnected;
    }

    /**
     * Get ESP32 identifier.
     *
     * @return string ESP32 ID
     */
    public function getEsp32Id(): string
    {
        return $this->esp32Id;
    }

    /**
     * Set connection status (for testing).
     *
     * @param  bool  $connected  Connection status
     */
    public function setConnected(bool $connected): void
    {
        $this->isConnected = $connected;
    }
}

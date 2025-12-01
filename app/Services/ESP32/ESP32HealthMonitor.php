<?php

namespace App\Services\ESP32;

/**
 * Monitors ESP32 health and heartbeat signals.
 */
class ESP32HealthMonitor
{
    protected string $esp32Id;

    protected int $messageCount = 0;

    /**
     * Create a new health monitor instance.
     */
    public function __construct()
    {
        $this->esp32Id = config('hardware.esp32_id', 'ESP32_COIN_001');
    }

    /**
     * Update last heartbeat timestamp.
     */
    public function updateHeartbeat(): void
    {
        cache()->put("esp32.{$this->esp32Id}.last_heartbeat", now(), now()->addMinutes(5));
    }

    /**
     * Get last heartbeat timestamp.
     *
     * @return \DateTime|null Last heartbeat or null if never received
     */
    public function getLastHeartbeat(): ?\DateTime
    {
        $heartbeat = cache()->get("esp32.{$this->esp32Id}.last_heartbeat");

        return $heartbeat ? $heartbeat->toDateTime() : null;
    }

    /**
     * Set last heartbeat (for testing).
     *
     * @param  mixed  $timestamp  Timestamp to set
     */
    public function setLastHeartbeat($timestamp): void
    {
        cache()->put("esp32.{$this->esp32Id}.last_heartbeat", $timestamp, now()->addMinutes(5));
    }

    /**
     * Check if ESP32 is healthy based on heartbeat.
     *
     * @return bool True if healthy
     */
    public function isHealthy(): bool
    {
        $lastHeartbeat = cache()->get("esp32.{$this->esp32Id}.last_heartbeat");

        if (! $lastHeartbeat) {
            return false;
        }

        // Consider unhealthy if no heartbeat in configured timeout
        return $lastHeartbeat->diffInSeconds(now()) < config('hardware.heartbeat_timeout', 30);
    }

    /**
     * Check if connection is stale.
     *
     * @param  int|null  $timeout  Timeout in seconds (uses config if not provided)
     * @return bool True if connection is stale
     */
    public function isConnectionStale(?int $timeout = null): bool
    {
        $timeout = $timeout ?? config('hardware.heartbeat_timeout', 30);
        $lastHeartbeat = $this->getLastHeartbeat();

        if (! $lastHeartbeat) {
            return true;
        }

        return (time() - $lastHeartbeat->getTimestamp()) > $timeout;
    }

    /**
     * Update status in cache.
     *
     * @param  string  $status  Status message
     */
    public function updateStatus(string $status): void
    {
        cache()->put("esp32.{$this->esp32Id}.status", $status, now()->addMinutes(5));
    }

    /**
     * Get current status from cache.
     *
     * @return string|null Current status or null
     */
    public function getStatus(): ?string
    {
        return cache()->get("esp32.{$this->esp32Id}.status");
    }

    /**
     * Increment message counter.
     */
    public function incrementMessageCount(): void
    {
        $this->messageCount++;
    }

    /**
     * Get message count.
     *
     * @return int Message count
     */
    public function getMessageCount(): int
    {
        return $this->messageCount;
    }

    /**
     * Reset message count.
     */
    public function resetMessageCount(): void
    {
        $this->messageCount = 0;
    }
}

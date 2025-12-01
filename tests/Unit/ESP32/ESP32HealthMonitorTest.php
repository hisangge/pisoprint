<?php

use App\Services\ESP32\ESP32HealthMonitor;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
    $this->monitor = new ESP32HealthMonitor;
});

afterEach(function () {
    Cache::flush();
});

test('can update heartbeat timestamp', function () {
    $this->monitor->updateHeartbeat();

    $lastHeartbeat = $this->monitor->getLastHeartbeat();

    expect($lastHeartbeat)->toBeInstanceOf(DateTime::class)
        ->and($lastHeartbeat->getTimestamp())->toBeLessThanOrEqual(time());
});

test('returns null when no heartbeat recorded', function () {
    $lastHeartbeat = $this->monitor->getLastHeartbeat();

    expect($lastHeartbeat)->toBeNull();
});

test('can set heartbeat manually', function () {
    $timestamp = now()->subMinutes(2);

    $this->monitor->setLastHeartbeat($timestamp);

    $retrieved = $this->monitor->getLastHeartbeat();

    expect($retrieved)->not->toBeNull()
        ->and($retrieved->getTimestamp())->toBe($timestamp->timestamp);
});

test('is healthy with recent heartbeat', function () {
    $this->monitor->updateHeartbeat();

    expect($this->monitor->isHealthy())->toBeTrue();
});

test('is not healthy with old heartbeat', function () {
    $oldHeartbeat = now()->subMinutes(5);
    $this->monitor->setLastHeartbeat($oldHeartbeat);

    expect($this->monitor->isHealthy())->toBeFalse();
});

test('is not healthy with no heartbeat', function () {
    expect($this->monitor->isHealthy())->toBeFalse();
});

test('connection is stale with old heartbeat', function () {
    $oldHeartbeat = now()->subSeconds(60);
    $this->monitor->setLastHeartbeat($oldHeartbeat);

    expect($this->monitor->isConnectionStale(30))->toBeTrue();
});

test('connection is not stale with recent heartbeat', function () {
    $recentHeartbeat = now()->subSeconds(10);
    $this->monitor->setLastHeartbeat($recentHeartbeat);

    expect($this->monitor->isConnectionStale(30))->toBeFalse();
});

test('connection is stale when no heartbeat exists', function () {
    expect($this->monitor->isConnectionStale())->toBeTrue();
});

test('can update and retrieve status', function () {
    $status = 'READY';

    $this->monitor->updateStatus($status);

    expect($this->monitor->getStatus())->toBe($status);
});

test('returns null when no status set', function () {
    expect($this->monitor->getStatus())->toBeNull();
});

test('can increment message count', function () {
    expect($this->monitor->getMessageCount())->toBe(0);

    $this->monitor->incrementMessageCount();
    expect($this->monitor->getMessageCount())->toBe(1);

    $this->monitor->incrementMessageCount();
    expect($this->monitor->getMessageCount())->toBe(2);
});

test('can reset message count', function () {
    $this->monitor->incrementMessageCount();
    $this->monitor->incrementMessageCount();

    expect($this->monitor->getMessageCount())->toBe(2);

    $this->monitor->resetMessageCount();

    expect($this->monitor->getMessageCount())->toBe(0);
});

test('uses configured heartbeat timeout', function () {
    config(['hardware.heartbeat_timeout' => 45]);

    $heartbeat = now()->subSeconds(40);
    $this->monitor->setLastHeartbeat($heartbeat);

    expect($this->monitor->isHealthy())->toBeTrue();

    $oldHeartbeat = now()->subSeconds(50);
    $this->monitor->setLastHeartbeat($oldHeartbeat);

    expect($this->monitor->isHealthy())->toBeFalse();
});

test('heartbeat data is cached', function () {
    $this->monitor->updateHeartbeat();

    // Create new monitor instance
    $newMonitor = new ESP32HealthMonitor;

    // Should retrieve cached heartbeat
    expect($newMonitor->getLastHeartbeat())->not->toBeNull();
});

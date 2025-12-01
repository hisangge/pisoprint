<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->validateCriticalConfiguration();
    }

    /**
     * Validate critical configuration values on application boot.
     *
     * Ensures that essential configuration values are properly set and valid
     * to prevent runtime errors and provide early feedback on misconfigurations.
     *
     * @throws \InvalidArgumentException When critical configuration is invalid
     */
    protected function validateCriticalConfiguration(): void
    {
        // Validate hardware configuration
        $acceptedCoins = config('hardware.accepted_coins');
        if (! is_array($acceptedCoins) || empty($acceptedCoins)) {
            throw new \InvalidArgumentException('Invalid coin configuration: hardware.accepted_coins must be a non-empty array');
        }

        foreach ($acceptedCoins as $coin) {
            if (! is_numeric($coin) || $coin <= 0) {
                throw new \InvalidArgumentException("Invalid coin value: {$coin}. All coin values must be positive numbers");
            }
        }

        // Validate printing configuration
        // $maxFileSize = config('printing.max_file_size');
        // if (! is_numeric($maxFileSize) || $maxFileSize <= 0) {
        //     throw new \InvalidArgumentException('Invalid file size configuration: printing.max_file_size must be a positive number');
        // }

        // $pricing = config('printing.pricing');
        // if (! is_array($pricing)) {
        //     throw new \InvalidArgumentException('Invalid pricing configuration: printing.pricing must be an array');
        // }

        // $requiredPricingKeys = ['bw', 'grayscale', 'color'];
        // foreach ($requiredPricingKeys as $key) {
        //     if (! isset($pricing[$key]) || ! is_numeric($pricing[$key]) || $pricing[$key] < 0) {
        //         throw new \InvalidArgumentException("Invalid pricing configuration: printing.pricing.{$key} must be a non-negative number");
        //     }
        // }

        // Validate ESP32 configuration
        $esp32Id = config('hardware.esp32_id');
        if (empty($esp32Id) || ! is_string($esp32Id)) {
            throw new \InvalidArgumentException('Invalid ESP32 configuration: hardware.esp32_id must be a non-empty string');
        }

        $baudRate = config('hardware.baud_rate', 115200);
        if (! is_numeric($baudRate) || $baudRate <= 0) {
            throw new \InvalidArgumentException('Invalid ESP32 configuration: hardware.baud_rate must be a positive number');
        }

        // Validate database configuration for critical features
        // $defaultPrinter = config('printing.default_printer_id');
        // if (empty($defaultPrinter) || ! is_string($defaultPrinter)) {
        //     throw new \InvalidArgumentException('Invalid printer configuration: printing.default_printer_id must be a non-empty string');
        // }
    }
}

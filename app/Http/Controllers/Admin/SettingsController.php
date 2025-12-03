<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Rawilk\Printing\Facades\Printing;

class SettingsController extends Controller
{
    /**
     * Display settings page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => [
                // Printing Settings
                'printing' => [
                    'defaultPrinter' => config('printing.default_printer_id'),
                    'cupsServer' => config('printing.drivers.cups.ip', 'localhost'),
                    'pricing' => [
                        'bw' => config('printing.prices.black_and_white'),
                        'grayscale' => config('printing.prices.grayscale'),
                        'color' => config('printing.prices.color'),
                    ],
                    'maxCopies' => config('printing.max_copies'),
                    'maxPagesPerJob' => config('printing.max_pages_per_job'),
                    'maxFileSize' => config('printing.max_file_size'),
                    'paperSize' => config('printing.paper_size'),
                ],
                // Hardware Settings
                'hardware' => [
                    'esp32Id' => config('hardware.esp32_id'),
                    'serialPort' => config('hardware.serial_port'),
                    'baudRate' => config('hardware.baud_rate'),
                    'heartbeatTimeout' => config('hardware.heartbeat_timeout'),
                    'acceptedCoins' => config('hardware.accepted_coins'),
                    'coinTimeout' => config('hardware.coin_timeout'),
                    'maxCoinPerTransaction' => config('hardware.max_coin_per_transaction'),
                ],
                // WiFi Settings
                'wifi' => [
                    'ssid' => config('hardware.wifi_ssid'),
                    'password' => config('hardware.wifi_password'),
                    'ipAddress' => config('hardware.wifi_ip_address'),
                    'dhcpRange' => config('hardware.wifi_dhcp_range'),
                ],
            ],
            'availablePrinters' => $this->getAvailablePrinters(),
        ]);
    }

    /**
     * Get list of available printers from CUPS.
     *
     * @return array<int, array{id: string, name: string, isOnline: bool}>
     */
    protected function getAvailablePrinters(): array
    {
        try {
            $printers = Printing::printers();

            return collect($printers)->map(fn ($printer) => [
                'id' => $printer->id(),
                'name' => $printer->name(),
                'isOnline' => $printer->isOnline(),
            ])->values()->toArray();
        } catch (\Exception $e) {
            Log::warning('Failed to fetch available printers', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // Printing settings
            'printing.defaultPrinter' => 'sometimes|string',
            'printing.cupsServer' => 'sometimes|string',
            'printing.pricing.bw' => 'sometimes|numeric|min:0',
            'printing.pricing.grayscale' => 'sometimes|numeric|min:0',
            'printing.pricing.color' => 'sometimes|numeric|min:0',
            'printing.maxCopies' => 'sometimes|integer|min:1',
            'printing.maxPagesPerJob' => 'sometimes|integer|min:1',
            'printing.maxFileSize' => 'sometimes|integer|min:0',
            'printing.paperSize' => 'sometimes|string',

            // Hardware settings
            'hardware.esp32Id' => 'sometimes|string',
            'hardware.serialPort' => 'sometimes|string',
            'hardware.baudRate' => 'sometimes|integer',
            'hardware.heartbeatTimeout' => 'sometimes|integer|min:1',
            'hardware.coinTimeout' => 'sometimes|integer|min:1',
            'hardware.maxCoinPerTransaction' => 'sometimes|integer|min:1',

            // WiFi settings
            'wifi.ssid' => 'sometimes|string',
            'wifi.password' => 'sometimes|string|min:8',
            'wifi.ipAddress' => 'sometimes|ip',
            'wifi.dhcpRange' => 'sometimes|string',
        ]);

        // Update .env file
        $this->updateEnvFile($validated);

        // Clear config cache to reload settings
        Artisan::call('config:clear');

        return redirect()->route('admin.settings.index')
            ->with('success', 'Settings updated successfully. Some changes may require a system restart.');
    }

    /**
     * Update .env file with new values.
     */
    protected function updateEnvFile(array $data): void
    {
        $envPath = base_path('.env');

        if (! File::exists($envPath)) {
            return;
        }

        $envContent = File::get($envPath);

        // Mapping of validated data to ENV keys
        $envMappings = [
            'printing.defaultPrinter' => 'PRINTING_DEFAULT_PRINTER_ID',
            'printing.cupsServer' => 'CUPS_SERVER_IP',
            'printing.pricing.bw' => 'PRICE_PER_PAGE_BW',
            'printing.pricing.grayscale' => 'PRICE_PER_PAGE_GRAYSCALE',
            'printing.pricing.color' => 'PRICE_PER_PAGE_COLOR',
            'printing.maxCopies' => 'MAX_COPIES',
            'printing.maxPagesPerJob' => 'MAX_PAGES_PER_JOB',
            'printing.maxFileSize' => 'MAX_FILE_SIZE',
            'printing.paperSize' => 'PAPER_SIZE',
            'hardware.esp32Id' => 'ESP32_ID',
            'hardware.serialPort' => 'ESP32_SERIAL_PORT',
            'hardware.baudRate' => 'ESP32_BAUD_RATE',
            'hardware.heartbeatTimeout' => 'ESP32_HEARTBEAT_TIMEOUT',
            'hardware.coinTimeout' => 'ESP32_COIN_TIMEOUT',
            'hardware.maxCoinPerTransaction' => 'ESP32_MAX_COIN_PER_TRANSACTION',
            'wifi.ssid' => 'WIFI_SSID',
            'wifi.password' => 'WIFI_PASSWORD',
            'wifi.ipAddress' => 'WIFI_IP',
            'wifi.dhcpRange' => 'WIFI_DHCP_RANGE',
        ];

        foreach ($envMappings as $dataKey => $envKey) {
            $value = data_get($data, $dataKey);

            if ($value !== null) {
                $value = is_string($value) && str_contains($value, ' ') ? "\"{$value}\"" : $value;

                // Update existing key or append new one
                if (preg_match("/^{$envKey}=.*/m", $envContent)) {
                    $envContent = preg_replace(
                        "/^{$envKey}=.*/m",
                        "{$envKey}={$value}",
                        $envContent
                    );
                } else {
                    $envContent .= "\n{$envKey}={$value}";
                }
            }
        }

        File::put($envPath, $envContent);
    }
}

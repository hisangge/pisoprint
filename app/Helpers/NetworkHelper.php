<?php

namespace App\Helpers;

class NetworkHelper
{
    /**
     * Get the Raspberry Pi's local network IP address.
     *
     * This method tries multiple approaches to detect the server's IP:
     * 1. Check for WiFi hotspot IP (192.168.4.x) on wlan0 first (for kiosk WiFi access)
     * 2. $_SERVER['SERVER_ADDR'] - works when accessed via web request
     * 3. hostname resolution
     * 4. Parse network interfaces (most reliable)
     * 5. Fallback to configured WiFi hotspot IP
     *
     * @return string The IP address
     */
    public static function getServerIpAddress(): string
    {
        // Skip network interface detection on Windows (not supported in tests)
        if (PHP_OS_FAMILY === 'Windows') {
            // Method 2: Check $_SERVER variable (works when accessed via web)
            if (! empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1') {
                return $_SERVER['SERVER_ADDR'];
            }

            // Method 3: Use hostname command
            $hostname = gethostname();
            $ip = gethostbyname($hostname);
            if ($ip !== $hostname && $ip !== '127.0.0.1') {
                return $ip;
            }

            // Fallback to configured WiFi IP or default
            return config('hardware.wifi_ip_address', '192.168.4.1');
        }

        // Method 1: Check wlan0 for WiFi hotspot IP (192.168.4.x) first
        // This is the most important for kiosk WiFi access
        exec("ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' 2>/dev/null", $wlan0Output, $returnCode);
        if ($returnCode === 0 && ! empty($wlan0Output)) {
            foreach ($wlan0Output as $ip) {
                // Prioritize 192.168.4.x subnet (WiFi hotspot)
                if (str_starts_with($ip, '192.168.4.')) {
                    return $ip;
                }
            }
            // Return first wlan0 IP if no hotspot IP found
            if (! empty($wlan0Output[0]) && $wlan0Output[0] !== '127.0.0.1') {
                return $wlan0Output[0];
            }
        }

        // Method 2: Check $_SERVER variable (works when accessed via web)
        if (! empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1') {
            return $_SERVER['SERVER_ADDR'];
        }

        // Method 3: Use hostname command
        $hostname = gethostname();
        $ip = gethostbyname($hostname);
        if ($ip !== $hostname && $ip !== '127.0.0.1') {
            return $ip;
        }

        // Method 4: Parse all network interfaces
        exec("ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' 2>/dev/null", $output, $returnCode);
        if ($returnCode === 0 && ! empty($output)) {
            // Prioritize 192.168.4.x subnet
            foreach ($output as $ip) {
                if (str_starts_with($ip, '192.168.4.')) {
                    return $ip;
                }
            }

            // Return first non-localhost IP
            return $output[0];
        }

        // Method 5: Check eth0 interface (Ethernet)
        exec("ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' 2>/dev/null", $output, $returnCode);
        if ($returnCode === 0 && ! empty($output)) {
            return $output[0];
        }

        // Fallback to configured WiFi IP or default
        return config('hardware.wifi_ip_address', '192.168.4.1');
    }

    /**
     * Get the URL to access the kiosk from WiFi network.
     *
     * @param  bool  $includeProtocol  Include http:// prefix
     * @return string The access URL
     */
    public static function getKioskAccessUrl(bool $includeProtocol = true): string
    {
        $ip = self::getServerIpAddress();
        $protocol = $includeProtocol ? 'http://' : '';

        return $protocol.$ip;
    }

    /**
     * Get WiFi hotspot information.
     *
     * @return array{ssid: string, password: string, ip: string, url: string}
     */
    public static function getWifiHotspotInfo(): array
    {
        $ip = self::getServerIpAddress();
        // Use configured domain if available (pisoprint.local), otherwise use IP
        $domain = env('KIOSK_DOMAIN', 'pisoprint.local');
        $url = 'http://'.$domain;

        // For development or if domain resolution fails, fall back to IP
        // In production, pisoprint.local should resolve via mDNS/Avahi
        if (env('APP_ENV') === 'local' || env('KIOSK_DOMAIN') === false) {
            $url = 'http://'.$ip;
        }

        return [
            'ssid' => config('hardware.wifi_ssid', 'PisoPrint_Kiosk'),
            'password' => config('hardware.wifi_password', 'PisoPrint2025'),
            'ip' => $ip,
            'url' => $url,
        ];
    }
}

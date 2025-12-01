<?php

return [

    /*
    |--------------------------------------------------------------------------
    | ESP32 Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for ESP32 coin acceptor hardware communication.
    |
    */

    'esp32_id' => env('ESP32_ID', 'ESP32_COIN_001'),
    'serial_port' => env('ESP32_SERIAL_PORT', '/dev/ttyUSB0'),
    'baud_rate' => env('ESP32_BAUD_RATE', 115200),
    'heartbeat_timeout' => env('ESP32_HEARTBEAT_TIMEOUT', 30), // Seconds

    /*
    |--------------------------------------------------------------------------
    | Coin Acceptor Settings
    |--------------------------------------------------------------------------
    |
    | Accepted coin denominations and validation settings.
    |
    */

    'accepted_coins' => [
        1.00,  // ₱1 coin
        5.00,  // ₱5 coin
        10.00, // ₱10 coin
        20.00, // ₱20 coin
    ],

    'coin_timeout' => 30, // Seconds to wait for next coin insertion
    'max_coin_per_transaction' => 100, // Maximum coins per transaction

    /*
    |--------------------------------------------------------------------------
    | Printer Configuration
    |--------------------------------------------------------------------------
    |
    | CUPS printer settings and print job configuration.
    |
    */

    'default_printer' => env('PRINTER_NAME', 'Brother_DCP-T720DW'),
    'cups_server' => env('CUPS_SERVER', 'localhost:631'),

    /*
    |--------------------------------------------------------------------------
    | USB Auto-mount Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for USB drive detection and auto-mounting.
    |
    */

    'usb_mount_point' => env('USB_MOUNT_POINT', '/mnt/usb'),
    'usb_allowed_extensions' => ['pdf', 'PDF'],
    'usb_max_file_size' => 50 * 1024 * 1024, // 50MB

    /*
    |--------------------------------------------------------------------------
    | WiFi Hotspot Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for WiFi access point.
    |
    */

    'wifi_ssid' => env('WIFI_SSID', 'PisoPrint_Kiosk'),
    'wifi_password' => env('WIFI_PASSWORD', 'PisoPrint2025'),
    'wifi_ip_address' => env('WIFI_IP', '192.168.4.1'),
    'wifi_dhcp_range' => env('WIFI_DHCP_RANGE', '192.168.4.100,192.168.4.200'),

];

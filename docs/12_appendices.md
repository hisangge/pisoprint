# 12. Appendices

This section contains complete code examples, configuration files, and technical references.

## 12.1 ESP32 Sample Code

Complete ESP32 firmware for coin detection and credit management.

**File: `esp32_coin_module.ino`**

```cpp
/**
 * Piso Print System - ESP32 Coin Module
 * Version: 2.0 (Production - UART Only)
 * Date: October 2025
 * 
 * Hardware: ESP32 Development Board (CH340C, USB-C, 30-Pin)
 * Communication: Serial UART to Raspberry Pi (115200 baud)
 * 
 * IMPORTANT: This ESP32 module does NOT have an LCD display.
 * All balance updates are sent to Raspberry Pi via UART and displayed
 * on the LAFVIN 7 Inch Touchscreen IPS DSI Display through the web-based kiosk UI (Chromium).
 * 
 * Pin Configuration:
 * - GPIO 25: Coin acceptor pulse input (with internal pull-up)
 * - GPIO 17: UART TX to Raspberry Pi GPIO 15 (RX)
 * - GPIO 16: UART RX from Raspberry Pi GPIO 14 (TX)
 * - GPIO 2:  Built-in LED for status indication
 */

#include <ArduinoJson.h>

// Pin Definitions
#define COIN_PIN 25           // GPIO pin for coin acceptor pulse
#define LED_PIN 2             // Built-in LED for status

// Configuration
#define DEBOUNCE_TIME 30      // Debounce time in milliseconds

// Multi-coin acceptor pulse configuration
// Different coins produce different pulse counts
#define PULSES_FOR_1_PESO 1   // ₱1 coin sends 1 pulse
#define PULSES_FOR_5_PESO 5   // ₱5 coin sends 5 pulses
#define PULSES_FOR_10_PESO 10 // ₱10 coin sends 10 pulses
#define PULSE_TIMEOUT 500     // Max time between pulses of same coin (ms)

// Serial Communication Configuration (to Raspberry Pi via UART)
#define BAUD_RATE 115200
#define RX_PIN 16             // ESP32 RX (GPIO 16) ← Pi TX (GPIO 14)
#define TX_PIN 17             // ESP32 TX (GPIO 17) → Pi RX (GPIO 15)

// Global Variables
volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseTime = 0;
volatile unsigned long firstPulseTime = 0;
float totalCredits = 0.0;
unsigned long lastHeartbeat = 0;

// UART Object for Raspberry Pi Communication
HardwareSerial SerialPi(2);   // Use UART2 for Pi communication

// Function Prototypes
void IRAM_ATTR coinPulseISR();
void processCoins();
void sendCreditUpdate(float amount);
void sendHeartbeat();

void setup() {
  // Initialize Serial (for debugging)
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("Piso Print ESP32 Coin Module v2.0");
  Serial.println("========================================");
  
  // Initialize UART communication with Raspberry Pi
  SerialPi.begin(BAUD_RATE, SERIAL_8N1, RX_PIN, TX_PIN);
  Serial.println("✓ UART to Raspberry Pi initialized");
  Serial.printf("  Baud: %d, RX: GPIO%d, TX: GPIO%d\n", BAUD_RATE, RX_PIN, TX_PIN);
  
  // Initialize pins
  pinMode(COIN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.println("✓ GPIO pins configured");
  
  // Attach interrupt for coin detection
  attachInterrupt(digitalPinToInterrupt(COIN_PIN), coinPulseISR, FALLING);
  Serial.println("✓ Coin pulse interrupt attached");
  
  // System ready
  Serial.println("========================================");
  Serial.println("✓ System Ready!");
  Serial.println("  Waiting for coin insertion...");
  Serial.println("  Balance displayed on Pi touchscreen");
  Serial.println("========================================\n");
  
  // Send initial status to Pi
  sendHeartbeat();
}

void loop() {
  // Process any detected coins
  processCoins();
  
  // Send heartbeat every 30 seconds
  if (millis() - lastHeartbeat > 30000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Blink LED to show system is running (every 2 seconds)
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 2000) {
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    lastBlink = millis();
  }
  
  delay(10);
}

// Interrupt Service Routine for coin pulse detection
void IRAM_ATTR coinPulseISR() {
  unsigned long currentTime = millis();
  
  // Debounce: ignore pulses too close together
  if (currentTime - lastPulseTime > DEBOUNCE_TIME) {
    // If this is the first pulse of a new coin
    if (pulseCount == 0) {
      firstPulseTime = currentTime;
    }
    
    pulseCount++;
    lastPulseTime = currentTime;
    
    // Visual feedback
    digitalWrite(LED_PIN, HIGH);
  }
}

void processCoins() {
  // Check if we have pulses and if timeout has occurred
  if (pulseCount > 0) {
    unsigned long timeSinceLastPulse = millis() - lastPulseTime;
    
    // If no new pulses for PULSE_TIMEOUT ms, process the coin
    if (timeSinceLastPulse > PULSE_TIMEOUT) {
      float creditAdded = 0.0;
      
      // Determine coin value based on pulse count
      if (pulseCount == PULSES_FOR_1_PESO) {
        creditAdded = 1.0;
        Serial.println("₱1 coin detected");
      } 
      else if (pulseCount == PULSES_FOR_5_PESO) {
        creditAdded = 5.0;
        Serial.println("₱5 coin detected");
      } 
      else if (pulseCount == PULSES_FOR_10_PESO) {
        creditAdded = 10.0;
        Serial.println("₱10 coin detected");
      }
      else if (pulseCount == 20) {
        creditAdded = 20.0;
        Serial.println("₱20 coin detected");
      }
      else {
        // Unknown pulse count - log error
        Serial.print("Unknown coin: ");
        Serial.print(pulseCount);
        Serial.println(" pulses");
        pulseCount = 0;
        firstPulseTime = 0;
        return;
      }
      
      // Update total credits
      totalCredits += creditAdded;
      
      // Reset pulse counter
      pulseCount = 0;
      firstPulseTime = 0;
      
      // Send update to Raspberry Pi (balance displayed on touchscreen)
      sendCreditUpdate(creditAdded);
      
      // Log to serial
      Serial.print("Credit added: ₱");
      Serial.print(creditAdded, 2);
      Serial.print(" | Total: ₱");
      Serial.println(totalCredits, 2);
      Serial.println("Balance displayed on Pi touchscreen");
      
      // Turn off LED
      digitalWrite(LED_PIN, LOW);
    }
  }
}

void sendCreditUpdate(float amount) {
  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["type"] = "credit_update";
  doc["device_id"] = "ESP32_001";
  doc["amount"] = amount;
  doc["total_balance"] = totalCredits;
  doc["timestamp"] = millis() / 1000;
  
  // Serialize to JSON string
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  // Send via UART to Raspberry Pi
  SerialPi.println(jsonBuffer);
  
  // Debug output
  Serial.println("─────────────────────────────────");
  Serial.print("✓ Sent to Pi: ");
  Serial.println(jsonBuffer);
  Serial.printf("  Credit Added: ₱%.2f\n", amount);
  Serial.printf("  Total Balance: ₱%.2f\n", totalCredits);
  Serial.println("─────────────────────────────────\n");
}

void sendHeartbeat() {
  // Create JSON heartbeat message
  StaticJsonDocument<200> doc;
  doc["type"] = "heartbeat";
  doc["device_id"] = "ESP32_001";
  doc["uptime"] = millis() / 1000;
  doc["balance"] = totalCredits;
  doc["timestamp"] = millis() / 1000;
  
  // Serialize and send
  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);
  SerialPi.println(jsonBuffer);
  
  Serial.print("♥ Heartbeat sent | Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println("s");
}
```

## 12.2 Laravel UART Listener Command

Artisan command for receiving credit updates from ESP32 via UART.

**File: `app/Console/Commands/UartListener.php`**

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use PhpSerial\Serial;

class UartListener extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'uart:listen
                            {--port=/dev/serial0 : UART serial port}
                            {--baud=115200 : Baud rate}';

    /**
     * The console command description.
     */
    protected $description = 'Listen for credit updates from ESP32 via UART';

    protected $serial;
    protected $running = true;

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $port = $this->option('port');
        $baud = $this->option('baud');

        $this->info("Starting UART listener on {$port} at {$baud} baud...");

        try {
            $this->serial = new Serial();
            $this->serial->deviceSet($port);
            $this->serial->confBaudRate($baud);
            $this->serial->confParity('none');
            $this->serial->confCharacterLength(8);
            $this->serial->confStopBits(1);
            $this->serial->deviceOpen();

            $this->info("Serial port opened successfully");
            $this->info("Waiting for messages from ESP32...");

            $buffer = '';

            while ($this->running) {
                $char = $this->serial->readPort();

                if ($char === false || $char === '') {
                    usleep(10000); // 10ms delay
                    continue;
                }

                $buffer .= $char;

                // Check if we have a complete line (ending with \n)
                if (str_contains($buffer, "\n")) {
                    $lines = explode("\n", $buffer);
                    $buffer = array_pop($lines); // Keep incomplete line in buffer

                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (!empty($line)) {
                            $this->processMessage($line);
                        }
                    }
                }
            }

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            Log::error("UART Listener error", ['exception' => $e]);
        } finally {
            if ($this->serial) {
                $this->serial->deviceClose();
            }
        }
    }

    /**
     * Process incoming message from ESP32
     */
    protected function processMessage(string $message): void
    {
        try {
            $data = json_decode($message, true);

            if (!$data) {
                $this->warn("Invalid JSON: {$message}");
                return;
            }

            $type = $data['type'] ?? 'unknown';

            match($type) {
                'credit_update' => $this->processCreditUpdate($data),
                'heartbeat' => $this->processHeartbeat($data),
                default => $this->warn("Unknown message type: {$type}"),
            };

        } catch (\Exception $e) {
            $this->error("Error processing message: " . $e->getMessage());
            Log::error("UART message processing error", [
                'message' => $message,
                'exception' => $e
            ]);
        }
    }

    /**
     * Process credit update from ESP32
     */
    protected function processCreditUpdate(array $data): void
    {
        $deviceId = $data['device_id'] ?? 'ESP32_001';
        $amount = (float) ($data['amount'] ?? 0);
        $totalBalance = (float) ($data['total_balance'] ?? 0);

        $this->line("Credit update: +₱{$amount} | Total: ₱{$totalBalance}");

        // Get or create guest session user
        $user = User::firstOrCreate(['id' => 1], [
            'name' => 'Guest Session',
            'email' => 'guest@pisoprint.local',
            'password' => bcrypt('not-used'),
        ]);

        $balanceBefore = $user->balance ?? 0;

        // Update session balance
        $user->increment('balance', $amount);
        $user->updated_at = now();
        $user->save();

        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'transaction_type' => 'coin_insert',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceBefore + $amount,
            'esp32_id' => $deviceId,
        ]);

        $this->info("✓ Database updated | Balance: ₱{$user->balance}");

        Log::info("Credit added", [
            'device_id' => $deviceId,
            'amount' => $amount,
            'total_balance' => $totalBalance,
            'user_id' => $user->id,
        ]);
    }

    /**
     * Process heartbeat from ESP32
     */
    protected function processHeartbeat(array $data): void
    {
        $deviceId = $data['device_id'] ?? 'ESP32_001';
        $uptime = $data['uptime'] ?? 0;
        $balance = (float) ($data['balance'] ?? 0);

        $this->line("♥ Heartbeat from {$deviceId} | Uptime: {$uptime}s | Balance: ₱{$balance}");

        Log::debug("ESP32 heartbeat received", [
            'device_id' => $deviceId,
            'uptime' => $uptime,
            'balance' => $balance,
        ]);
    }
}
```

**Install PHP Serial Extension:**

```bash
# Install dependencies
sudo apt-get install php8.3-dev php-pear

# Install dio extension (for serial communication)
sudo pecl install dio

# Enable extension
echo "extension=dio.so" | sudo tee -a /etc/php/8.3/cli/php.ini
echo "extension=dio.so" | sudo tee -a /etc/php/8.3/fpm/php.ini

# Or use Composer package (alternative - pure PHP implementation)
composer require php-serial/php-serial

# Grant permissions to serial port
sudo usermod -a -G dialout www-data
sudo usermod -a -G dialout pi
sudo chmod 666 /dev/serial0
```

## 12.3 Systemd Service Configuration

**Laravel UART Listener Service**

**File: `/etc/systemd/system/uart-listener.service`**

```ini
[Unit]
Description=Piso Print UART Listener (Laravel)
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/var/www/piso-print
ExecStart=/usr/bin/php /var/www/piso-print/artisan uart:listen
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Laravel Print Monitor Service**

**File: `/etc/systemd/system/print-monitor.service`**

```ini
[Unit]
Description=Piso Print Job Monitor (Laravel)
After=network.target cups.service

[Service]
Type=simple
User=pi
WorkingDirectory=/var/www/piso-print
ExecStart=/usr/bin/php /var/www/piso-print/artisan print:monitor --interval=2
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Nginx Service (Web Server)**

**File: `/etc/nginx/sites-available/piso-print`**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pisoprintkiosk.local 192.168.4.1;
    
    root /var/www/piso-print/public;
    index index.php index.html;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Enable and Start Services:**

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable uart-listener
sudo systemctl enable print-monitor
sudo systemctl enable nginx
sudo systemctl enable php8.3-fpm
sudo systemctl enable mysql

# Start services
sudo systemctl start uart-listener
sudo systemctl start print-monitor
sudo systemctl start nginx
sudo systemctl start php8.3-fpm
sudo systemctl start mysql

# Check status
sudo systemctl status uart-listener
sudo systemctl status print-monitor
sudo systemctl status nginx

# View logs
sudo journalctl -u uart-listener -f
sudo journalctl -u print-monitor -f
```

## 12.4 Coin Acceptor Configuration Guide

### Hardware Setup

**1. Wiring Connections:**

```
Coin Acceptor          ESP32
─────────────          ─────
+12V (Red)       →     External 12V Power Supply
GND (Black)      →     GND (Common ground with ESP32)
COIN (White)     →     GPIO 25
COUNTER (Blue)   →     Not used (optional)
```

**2. Power Supply Requirements:**
- Voltage: 12V DC
- Current: 2A minimum
- Ensure stable power (use regulated supply)
- Do NOT power from ESP32 (insufficient current)

### Programming the Coin Acceptor

**Multi-Coin Configuration (ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor)**

The ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor must be configured to accept ₱1, ₱5, ₱10, and ₱20 coins. Each denomination produces a different pulse count:
- ₱1 coin: **1 pulse**
- ₱5 coin: **5 pulses**
- ₱10 coin: **10 pulses**
- ₱20 coin: **20 pulses**

**Method 1: DIP Switches (if available)**
- Configure switches to enable all four denominations (₱1, ₱5, ₱10, ₱20)
- Set pulse output for each coin type
- Refer to ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor manual for exact switch positions

**Method 2: Learning Mode (Recommended)**

1. Press and hold "SET" button for 3 seconds
2. LED blinks indicating learning mode
3. **For ₱1 coin:**
   - Insert sample ₱1 coin (use genuine, clean coin)
   - LED will blink **1 time** (confirming 1-pulse setting)
4. **For ₱5 coin:**
   - Press "SET" button again briefly
   - Insert sample ₱5 coin
   - LED will blink **5 times** (confirming 5-pulse setting)
5. **For ₱10 coin:**
   - Press "SET" button again briefly
   - Insert sample ₱10 coin
   - LED will blink **10 times** (confirming 10-pulse setting)
6. **For ₱20 coin (optional):**
   - Press "SET" button again briefly
   - Insert sample ₱20 coin
   - LED will blink **20 times** (confirming 20-pulse setting)
7. Press and hold "SET" to save configuration
7. Test with all three coin types to verify

### Testing

**Test ₱1 coin:**
- Insert ₱1 coin
- ESP32 should detect **1 pulse** on GPIO 25
- Touchscreen should display: "Balance: ₱1.00"

**Test ₱5 coin:**
- Insert ₱5 coin
- ESP32 should detect **5 pulses**
- Touchscreen should display: "Balance: ₱5.00"

**Test ₱10 coin:**
- Insert ₱10 coin
- ESP32 should detect **10 pulses**
- Touchscreen should display: "Balance: ₱10.00"

**Test ₱20 coin:**
- Insert ₱20 coin
- ESP32 should detect **20 pulses**
- Touchscreen should display: "Balance: ₱20.00"

### Troubleshooting

**Coins not accepted:**
- Clean the coin path
- Reprogram with fresh coin samples for all denominations
- Check coins are not damaged or dirty
- Verify coin acceptor is properly calibrated

**Wrong credit amount detected:**
- Check pulse count configuration in ESP32 code matches acceptor settings
- Re-learn coin denominations in acceptor
- Verify PULSE_TIMEOUT setting (should be 500ms)

**Multiple credits per coin:**
- Increase DEBOUNCE_TIME in code (try 50ms instead of 30ms)
- Check for loose wiring causing electrical noise
- Ensure proper grounding

**No detection:**
- Verify 12V power supply working
- Check GND connection between ESP32 and acceptor
- Test GPIO pin with LED (should blink on coin)
- Use Serial Monitor to see pulse count for debugging

## 12.5 WiFi Hotspot Configuration

For standalone operation, configure the Raspberry Pi as a WiFi access point.

### Install Required Packages

```bash
sudo apt update
sudo apt install hostapd dnsmasq -y
sudo systemctl unmask hostapd
sudo systemctl disable hostapd
sudo systemctl disable dnsmasq
```

### Configure Static IP

Edit `/etc/dhcpcd.conf`:

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:

```conf
# Static IP for WiFi Access Point
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

### Configure DHCP Server

Create `/etc/dnsmasq.conf`:

```bash
sudo nano /etc/dnsmasq.conf
```

```conf
# DHCP Server Configuration for Piso Print Hotspot
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
domain=wlan
address=/gw.wlan/192.168.4.1

# DNS settings
server=8.8.8.8
server=8.8.4.4
```

### Configure Access Point

Create `/etc/hostapd/hostapd.conf`:

```bash
sudo nano /etc/hostapd/hostapd.conf
```

```conf
# WiFi Access Point Configuration
interface=wlan0
driver=nl80211

# WiFi Network Settings
ssid=PisoPrint_Kiosk
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0

# Security Settings (WPA2-PSK)
wpa=2
wpa_passphrase=PisoPrint2025
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP

# Country Code (Philippines)
country_code=PH
```

Update `/etc/default/hostapd`:

```bash
sudo nano /etc/default/hostapd
```

Set:

```conf
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

### Enable Services

```bash
# Reload dhcpcd
sudo systemctl restart dhcpcd

# Enable and start services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq
sudo systemctl start hostapd
sudo systemctl start dnsmasq

# Check status
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

### Verify

1. Check WiFi interface: `ifconfig wlan0` (should show inet 192.168.4.1)
2. Scan for "PisoPrint_Kiosk" network on phone/laptop
3. Connect with password: `PisoPrint2025`
4. Access web interface: http://192.168.4.1

---

## 12.6 Chromium Kiosk Mode Setup

Complete setup for running Piso Print in full-screen kiosk mode on Raspberry Pi.

### Automatic Setup Script

**File: `kiosk-setup.sh`** (Located in project root)

Run this script on your Raspberry Pi to automatically configure kiosk mode:

```bash
# Download and run setup script
cd /home/pi
wget https://your-repo/kiosk-setup.sh
bash kiosk-setup.sh
```

### Manual Setup (Alternative)

**1. Install Required Packages:**

```bash
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter xdotool
```

**2. Create Kiosk Startup Script:**

```bash
nano /home/pi/start-kiosk.sh
```

```bash
#!/bin/bash
# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor
unclutter -idle 0.1 -root &

# Wait for Laravel
sleep 5
while ! curl -s http://localhost > /dev/null; do
    sleep 2
done

# Start Chromium in kiosk mode with watchdog
while true; do
    chromium-browser \
        --kiosk \
        --noerrdialogs \
        --disable-infobars \
        --no-first-run \
        --incognito \
        --disable-translate \
        --app=http://localhost
    
    sleep 2  # Auto-restart if crash
done
```

```bash
chmod +x /home/pi/start-kiosk.sh
```

**3. Configure Autostart:**

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/piso-print-kiosk.desktop
```

```ini
[Desktop Entry]
Type=Application
Name=Piso Print Kiosk
Exec=/home/pi/start-kiosk.sh
X-GNOME-Autostart-enabled=true
```

**4. Disable Screen Blanking:**

```bash
sudo nano /etc/lightdm/lightdm.conf.d/50-no-screensaver.conf
```

```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

**5. Disable Keyboard Shortcuts:**

```bash
mkdir -p ~/.config/openbox
cp /etc/xdg/openbox/rc.xml ~/.config/openbox/rc.xml
nano ~/.config/openbox/rc.xml
```

Add before `</keyboard>`:

```xml
<!-- Disable escape keys -->
<keybind key="A-Tab"><action name="Execute"><command>true</command></action></keybind>
<keybind key="A-F4"><action name="Execute"><command>true</command></action></keybind>
<keybind key="C-A-t"><action name="Execute"><command>true</command></action></keybind>
```

**6. Create Exit Script (For Maintenance):**

```bash
nano /home/pi/exit-kiosk.sh
```

```bash
#!/bin/bash
pkill -f chromium-browser
pkill -f start-kiosk
echo "Kiosk mode exited"
```

```bash
chmod +x /home/pi/exit-kiosk.sh
```

### Testing

```bash
# Test kiosk mode
/home/pi/start-kiosk.sh

# Exit kiosk mode (for testing)
# Press Ctrl+Alt+F1, login, then run:
/home/pi/exit-kiosk.sh
```

### Maintenance Access

**Method 1: SSH from another computer**
```bash
ssh pi@192.168.1.100
/home/pi/exit-kiosk.sh
```

**Method 2: Switch to TTY**
- Press `Ctrl+Alt+F1` on keyboard
- Login as `pi`
- Run: `/home/pi/exit-kiosk.sh`

**Method 3: Remote command**
```bash
# From another computer
ssh pi@192.168.1.100 '/home/pi/exit-kiosk.sh'
```

### Kiosk Features

✅ **Full-screen** - No browser UI visible
✅ **No escape** - Users cannot exit to desktop
✅ **Auto-restart** - Watchdog restarts if crash
✅ **Keyboard disabled** - F11, Alt+Tab, etc. blocked
✅ **Touch optimized** - Works perfectly with touchscreen
✅ **Auto-start** - Launches on boot
✅ **Maintenance access** - SSH or TTY for admins

---

**End of Documentation**

**Document Control:**
- **Version**: 2.2
- **Last Updated**: October 29, 2025
- **Prepared By**: 
  - Leodyver S. Semilla (Project Lead)
  - Mangarin, Raesell Ann A.
  - Pelayo, Trisha Nicole
  - Lanot, Louvee Jane S.
  - Consumo, Micaela Rose G.

**Contact Information:**
- **Email**: leodyversemilla07@gmail.com
- **Phone**: 09777616365

**© 2025 Piso Print System. All rights reserved.**

---

**Navigation:**
- [← Previous: Future Enhancements](11_future_enhancements.md)
- [↑ Back to Index](README.md)

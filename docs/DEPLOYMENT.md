# Piso Print - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Hardware Setup](#hardware-setup)
3. [Raspberry Pi OS Configuration](#raspberry-pi-os-configuration)
4. [Application Installation](#application-installation)
5. [CUPS Printer Setup](#cups-printer-setup)
6. [ESP32 Configuration](#esp32-configuration)
7. [WiFi Hotspot Setup](#wifi-hotspot-setup)
8. [USB Auto-mount Setup](#usb-auto-mount-setup)
9. [Kiosk Mode Configuration](#kiosk-mode-configuration)
10. [Service Configuration](#service-configuration)
11. [Testing & Validation](#testing--validation)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements
- Raspberry Pi 4 (4GB+ RAM recommended)
- MicroSD Card (32GB+ Class 10)
- ESP32 Development Board with coin acceptor
- Brother DCP-T720DW Printer (or compatible)
- 7" Touchscreen Display (800x480 or 1024x600)
- USB WiFi Adapter (for hotspot)
- Power Supply (5V 3A for Pi)
- USB Cable for ESP32

### Software Requirements
- Raspberry Pi OS (64-bit, Bookworm or later)
- PHP 8.3+
- Node.js 20+
- MySQL 8.0+
- CUPS 2.4+

---

## Hardware Setup

### 1. Physical Assembly

```bash
# Connect components:
# 1. Raspberry Pi to 7" touchscreen via DSI/HDMI
# 2. ESP32 to Raspberry Pi USB port
# 3. Printer to network (WiFi or Ethernet)
# 4. Coin acceptor to ESP32 GPIO pins
# 5. Power all devices
```

### 2. Verify Connections

```bash
# Check USB devices
lsusb

# Should see ESP32 (e.g., Silicon Labs CP210x)

# Check serial ports
ls -la /dev/ttyUSB*

# Should see /dev/ttyUSB0 (or similar)
```

---

## Raspberry Pi OS Configuration

### 1. Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    git curl wget \
    build-essential \
    vim nano \
    htop \
    net-tools \
    ca-certificates \
    gnupg lsb-release
```

### 2. Install PHP 8.3

```bash
# Add Sury PHP repository (for Debian/Raspberry Pi OS)
sudo apt install -y apt-transport-https lsb-release ca-certificates curl
sudo curl -sSL https://packages.sury.org/php/README.txt | sudo bash -x
sudo apt update

# Install PHP and extensions
sudo apt install -y \
    php8.3-cli \
    php8.3-fpm \
    php8.3-mysql \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-curl \
    php8.3-zip \
    php8.3-gd \
    php8.3-bcmath

# Verify installation
php -v
```

### 3. Install Composer

```bash
# Download and install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Verify installation
composer --version
```

### 4. Install Node.js 20

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node -v
npm -v
```

### 5. Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE piso_print CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'your_secure_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON piso_print.* TO 'pisoprint'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 6. Install Nginx (Production Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

---

## Application Installation

### 1. Clone Repository

```bash
# Navigate to home directory
cd /home/leodyversemilla07

# Clone the repository
git clone https://github.com/leodyversemilla07/piso-print.git
cd piso-print

# Set permissions
sudo chown -R leodyversemilla07:www-data /home/leodyversemilla07/piso-print
sudo chmod -R 775 storage bootstrap/cache
```

### 2. Install Dependencies

```bash
# Install PHP dependencies (production mode)
composer install --optimize-autoloader --no-dev

# Install Node.js dependencies
npm install

# Build frontend assets (IMPORTANT: Must be done on Raspberry Pi)
npm run build

# This will create public/build directory with compiled assets
# Build time: ~2-5 minutes depending on Pi model
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit environment variables
nano .env
```

**Update the following in `.env`:**

```env
APP_NAME="Piso Print"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=piso_print
DB_USERNAME=pisoprint
DB_PASSWORD=your_secure_password_here

# CUPS Configuration
CUPS_SERVER=localhost
CUPS_DEFAULT_PRINTER=Brother-DCP-T720DW

# ESP32 Configuration
ESP32_SERIAL_PORT=/dev/ttyUSB0
ESP32_BAUD_RATE=115200
ESP32_ID=ESP32_COIN_001
ESP32_HEARTBEAT_TIMEOUT=30

# Printer Configuration
PRINTER_NAME=Brother_DCP-T720DW

# Printing Prices (in Pesos)
PRICE_PER_PAGE_BW=2.00
PRICE_PER_PAGE_GRAYSCALE=3.00
PRICE_PER_PAGE_COLOR=5.00

# Print Job Limits
MAX_COPIES=100
MAX_PAGES_PER_JOB=500
PAPER_SIZE=Letter

# USB Configuration
USB_MOUNT_POINT=/media/usb

# WiFi Hotspot Configuration
WIFI_SSID=PisoPrint_Kiosk
WIFI_PASSWORD=PisoPrint2025
WIFI_IP=192.168.4.1
WIFI_DHCP_RANGE=192.168.4.100,192.168.4.200
```

### 4. Run Migrations

```bash
# Run database migrations
php artisan migrate --force

# Optional: Seed sample data
php artisan db:seed
```

### 5. Optimize Application

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### 6. Configure Nginx for Production

```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/piso-print
```

**Add the following configuration:**

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /home/leodyversemilla07/piso-print/public;
    index index.php index.html;
    
    server_name localhost pisoprint.local;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP handler
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/piso-print /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

---

## CUPS Printer Setup

### 1. Install CUPS

```bash
# Install CUPS and drivers
sudo apt install -y cups cups-client printer-driver-brlaser

# Add user to lpadmin group
sudo usermod -a -G lpadmin pi

# Enable CUPS service
sudo systemctl enable cups
sudo systemctl start cups
```

### 2. Configure Printer

```bash
# Access CUPS web interface
# Open browser: http://localhost:631

# Or use command line:
# Find printer
lpinfo -v

# Add printer (replace with your printer's URI)
sudo lpadmin -p Brother_DCP_T720DW \
    -v "ipp://192.168.1.100/ipp/print" \
    -m everywhere \
    -E

# Set as default
sudo lpadmin -d Brother_DCP_T720DW

# Test print
echo "Test Print" | lp
```

### 3. Configure CUPS for Web Access

```bash
# Edit CUPS configuration
sudo nano /etc/cups/cupsd.conf
```

**Add/modify:**

```conf
# Allow access from localhost
Listen localhost:631
Listen /var/run/cups/cups.sock

# Allow web interface access
<Location />
  Order allow,deny
  Allow localhost
</Location>

<Location /admin>
  Order allow,deny
  Allow localhost
</Location>
```

```bash
# Restart CUPS
sudo systemctl restart cups
```

---

## ESP32 Configuration

### 1. Flash ESP32 Firmware

**Complete ESP32 firmware is available in the `esp32-firmware/` directory.**

The firmware handles:
- Coin acceptor pulse counting (GPIO 25)
- USB Serial communication with Raspberry Pi (115200 baud)
- Heartbeat messages (every 30 seconds)
- Error reporting and acknowledgments
- LED status indicators

**Installation Steps:**

```bash
# On your development machine (Windows/Mac/Linux)

# 1. Navigate to ESP32 firmware directory
cd esp32-firmware

# 2. Read the comprehensive installation guide
cat README.md

# 3. Follow Arduino IDE setup instructions:
#    - Install ESP32 board support
#    - Install CH340 driver (if needed)
#    - Open piso-print-coin-acceptor.ino
#    - Select Board: ESP32 Dev Module
#    - Select Port: COM3 (or your port)
#    - Click Upload

# 4. Test with Serial Monitor (115200 baud)
#    Expected output: STATUS:READY, HEARTBEAT every 30s

# 5. Refer to testing guide for complete validation
cat TESTING.md
```

**Key Firmware Features:**
- Simple text protocol: `COIN:5.00\n`, `HEARTBEAT\n`, `STATUS:READY\n`
- USB communication (no GPIO UART wiring needed)
- Matches Laravel `ESP32CommunicationService` expectations
- Production-ready with error handling

**Documentation:**
- **Installation:** `esp32-firmware/README.md`
- **Testing:** `esp32-firmware/TESTING.md` (20-step checklist)
- **Wiring:** `esp32-firmware/WIRING.md` (detailed diagrams)
- **Changes:** `esp32-firmware/CHANGES.md` (protocol explanation)

**Quick Upload (Arduino IDE):**
1. Open `esp32-firmware/piso-print-coin-acceptor.ino`
2. Tools → Board → ESP32 Dev Module
3. Tools → Port → Select COM port
4. Click Upload button (→)
5. Verify in Serial Monitor (115200 baud)

### 2. Configure Serial Permissions on Raspberry Pi

```bash
# Add user to dialout group
sudo usermod -a -G dialout leodyversemilla07

# Log out and back in for group changes to take effect
# Or reboot: sudo reboot

# Verify group membership
groups leodyversemilla07 | grep dialout

# Create udev rule for persistent permissions
sudo nano /etc/udev/rules.d/99-esp32.rules
```

**Add:**

```
# CH340 USB-to-Serial (ESP32)
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", MODE="0666", GROUP="dialout"
```

```bash
# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# Verify ESP32 is detected
lsusb | grep CH340
ls -la /dev/ttyUSB0
```

---

## WiFi Hotspot Setup

```bash
# Run the WiFi hotspot setup script
sudo bash setup-wifi-hotspot.sh

# The script will:
# - Install hostapd and dnsmasq
# - Configure wlan0 as access point
# - Set up NAT for internet sharing
# - Create systemd service

# Verify hotspot
sudo systemctl status hostapd
sudo systemctl status dnsmasq

# Check if AP is broadcasting
iwconfig wlan0
```

---

## USB Auto-mount Setup

```bash
# Run the USB auto-mount setup script
sudo bash setup-usb-automount.sh

# The script will:
# - Install usbmount
# - Create udev rules
# - Set up inotify watcher for PDF files
# - Copy PDFs to application folder

# Test by inserting USB drive with PDF files
# Files should appear in storage/app/usb-uploads/
```

---

## Kiosk Mode Configuration

### Overview
The kiosk runs on a **7-inch touchscreen (800×480px)** in fullscreen Chromium browser with:
- **Chromium 130+** in kiosk mode (no navigation bars, fullscreen)
- **unclutter** (hides mouse cursor)
- **Optimized UI** for small touchscreen
- **Auto-start on boot**

### 1. Install Required Packages

```bash
# Install Chromium browser
sudo apt install -y chromium-browser

# Install X11 utilities
sudo apt install -y \
    x11-xserver-utils \
    xinit \
    xdotool \
    unclutter \
    matchbox-window-manager

# Install screen utilities
sudo apt install -y \
    xscreensaver \
    xserver-xorg-legacy
```

### 2. Configure 7-Inch Display

```bash
# For LAFVIN 7" Touchscreen (800×480 via DSI)
# Edit boot config
sudo nano /boot/config.txt
```

**Add/modify these lines:**

```ini
# 7-inch touchscreen configuration
dtoverlay=vc4-kms-v3d
max_framebuffers=2

# Force 800x480 resolution
hdmi_group=2
hdmi_mode=87
hdmi_cvt=800 480 60 6 0 0 0

# Disable screen blanking
hdmi_blanking=1

# Touch calibration (if needed)
# dtoverlay=ads7846,cs=1,penirq=25,penirq_pull=2,speed=50000,keep_vref_on=0,swapxy=0,pmax=255,xohms=150,xmin=200,xmax=3900,ymin=200,ymax=3900
```

```bash
# Reboot to apply changes
sudo reboot
```

### 3. Disable Screen Blanking & Power Management

```bash
# Edit lightdm config
sudo nano /etc/lightdm/lightdm.conf
```

**Add/modify under `[Seat:*]` section:**

```ini
[Seat:*]
# Disable screen saver
xserver-command=X -s 0 -dpms

# Auto-login for kiosk
autologin-user=leodyversemilla07
autologin-user-timeout=0
```

```bash
# Disable DPMS (power management)
sudo nano /etc/X11/xorg.conf
```

**Create file with:**

```
Section "ServerFlags"
    Option "BlankTime" "0"
    Option "StandbyTime" "0"
    Option "SuspendTime" "0"
    Option "OffTime" "0"
EndSection

Section "Extensions"
    Option "DPMS" "Disable"
EndSection
```

### 4. Create Kiosk Startup Script

```bash
# Create kiosk startup script
nano /home/leodyversemilla07/start-kiosk.sh
```

**Add the following content:**

```bash
#!/bin/bash
# Piso Print Kiosk Startup Script
# Optimized for 7-inch touchscreen (800×480px)

# Wait for X server
sleep 3

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor
unclutter -idle 0.1 -root &

# Set display resolution (if not auto-detected)
xrandr --output DSI-1 --mode 800x480 || xrandr --output HDMI-1 --mode 800x480

# Remove any existing chromium lock files
rm -rf ~/.config/chromium/Singleton*

# Close any existing Chromium instances
killall chromium-browser 2>/dev/null

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-translate \
  --disable-sync \
  --disable-background-networking \
  --disable-software-rasterizer \
  --disable-gpu \
  --window-size=800,480 \
  --window-position=0,0 \
  --start-fullscreen \
  --app=http://localhost &

# Optional: Watchdog to restart if browser crashes
while true; do
    sleep 30
    if ! pgrep -f "chromium-browser" > /dev/null; then
        echo "Chromium crashed, restarting..."
        chromium-browser --kiosk --app=http://localhost &
    fi
done
```

```bash
# Make script executable
chmod +x /home/leodyversemilla07/start-kiosk.sh
```

### 5. Configure Autostart

```bash
# Create autostart directory
mkdir -p /home/leodyversemilla07/.config/autostart

# Create autostart desktop entry
nano /home/leodyversemilla07/.config/autostart/piso-print-kiosk.desktop
```

**Add:**

```ini
[Desktop Entry]
Type=Application
Name=Piso Print Kiosk
Comment=Start Piso Print in kiosk mode
Exec=/home/leodyversemilla07/start-kiosk.sh
X-GNOME-Autostart-enabled=true
```

### 6. Optimize Chromium for 7-Inch Screen

```bash
# Create Chromium preferences for better touch experience
mkdir -p /home/leodyversemilla07/.config/chromium/Default

nano /home/leodyversemilla07/.config/chromium/Default/Preferences
```

**Add:**

```json
{
  "browser": {
    "check_default_browser": false
  },
  "profile": {
    "default_content_setting_values": {
      "notifications": 2
    }
  },
  "download": {
    "prompt_for_download": false,
    "directory_upgrade": true
  },
  "translate": {
    "enabled": false
  }
}
```

### 7. Create Systemd Service (Alternative)

**If you prefer systemd service over autostart:**

```bash
# Create kiosk service file
sudo nano /etc/systemd/system/piso-print-kiosk.service
```

**Add:**

```ini
[Unit]
Description=Piso Print Kiosk Mode
After=graphical.target network-online.target nginx.service
Wants=graphical.target

[Service]
Type=simple
User=leodyversemilla07
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/leodyversemilla07/.Xauthority
ExecStartPre=/bin/sleep 10
ExecStart=/home/leodyversemilla07/start-kiosk.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=graphical.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable piso-print-kiosk
sudo systemctl start piso-print-kiosk

# Check status
sudo systemctl status piso-print-kiosk

# View logs
sudo journalctl -u piso-print-kiosk -f
```

### 8. CSS Optimizations for 7-Inch Screen

The application already includes optimized CSS for 800×480px screens. Key optimizations:

**In `resources/css/kiosk.css`:**
- Compact spacing (2-3px padding)
- Smaller text (xs, sm sizes)
- Larger touch targets (min 44×44px buttons)
- Single-column layouts
- Reduced whitespace
- Optimized card sizes

**All kiosk pages optimized:**
- ✅ `home.tsx` - Compact pricing cards
- ✅ `file-selection.tsx` - Smaller dropzone
- ✅ `print-preview.tsx` - Collapsible PDF preview
- ✅ `payment.tsx` - Large payment display
- ✅ `print-status.tsx` - Compact status view

### 9. Test Kiosk Mode

```bash
# Method 1: Reboot (recommended)
sudo reboot

# Method 2: Restart X session
sudo systemctl restart lightdm

# Method 3: Manual start (for testing)
DISPLAY=:0 /home/leodyversemilla07/start-kiosk.sh
```

### 10. Verify Kiosk Configuration

```bash
# Check if Chromium is running
ps aux | grep chromium

# Check resolution
DISPLAY=:0 xrandr

# Check if unclutter is hiding cursor
ps aux | grep unclutter

# Test touch screen
DISPLAY=:0 xinput list

# View kiosk logs
tail -f /var/log/syslog | grep chromium
```

### 11. Troubleshooting Kiosk Mode

#### Issue: Screen is blank

```bash
# Check if X server is running
ps aux | grep Xorg

# Check lightdm status
sudo systemctl status lightdm

# Restart lightdm
sudo systemctl restart lightdm
```

#### Issue: Wrong resolution

```bash
# Check current resolution
DISPLAY=:0 xrandr

# Force resolution
DISPLAY=:0 xrandr --output DSI-1 --mode 800x480

# Or add to start-kiosk.sh:
xrandr --newmode "800x480_60.00"  29.50  800 824 896 992  480 483 493 500 -hsync +vsync
xrandr --addmode DSI-1 800x480_60.00
xrandr --output DSI-1 --mode 800x480_60.00
```

#### Issue: Touch screen not working

```bash
# List input devices
DISPLAY=:0 xinput list

# Calibrate touch screen (if needed)
sudo apt install xinput-calibrator
DISPLAY=:0 xinput_calibrator
```

#### Issue: Chromium won't start

```bash
# Remove lock files
rm -rf ~/.config/chromium/Singleton*

# Check Chromium manually
chromium-browser --version

# Run with verbose logging
chromium-browser --kiosk --enable-logging --v=1 http://localhost
```

#### Issue: Application UI too large

```bash
# Check if CSS is loaded
curl http://localhost/build/assets/app.css | head

# Rebuild frontend assets
cd /home/leodyversemilla07/piso-print
npm run build

# Clear browser cache
rm -rf ~/.cache/chromium
```

### 12. Keyboard Shortcuts (Emergency)

In case you need to exit kiosk mode temporarily:

- **Alt + F4** - Close Chromium
- **Ctrl + Alt + F1** - Switch to TTY1 (text console)
- **Ctrl + Alt + F7** - Switch back to GUI

### 13. Remote Access (Optional)

For maintenance without physical access:

```bash
# Install VNC server
sudo apt install -y tigervnc-standalone-server

# Or SSH with X forwarding
ssh -X leodyversemilla07@raspberrypi.local

# View display remotely
DISPLAY=:0 xwd -root -out screenshot.xwd
```

### 14. Performance Monitoring

```bash
# Check CPU/Memory usage
htop

# Monitor GPU temperature
vcgencmd measure_temp

# Check Chromium memory usage
ps aux --sort=-%mem | grep chromium

# Monitor network
iftop
```

### 15. Kiosk Security

```bash
# Disable terminal access (optional)
sudo systemctl disable getty@tty1

# Hide boot messages
sudo nano /boot/cmdline.txt
# Add: quiet splash loglevel=0 vt.global_cursor_default=0

# Disable right-click in Chromium
# Add to start-kiosk.sh:
# --disable-context-menu

# Lock down USB ports (if needed)
sudo nano /etc/modprobe.d/blacklist-usb-storage.conf
# Add: blacklist usb-storage
```

---

---

## Service Configuration

### 1. ESP32 Listener Service

**First, update service file paths:**

```bash
# Edit service file to use correct path
sudo nano piso-print-esp32.service
```

Update `WorkingDirectory` and `ExecStart` to:
```ini
WorkingDirectory=/home/leodyversemilla07/piso-print
ExecStart=/usr/bin/php /home/leodyversemilla07/piso-print/artisan esp32:listen --port=/dev/ttyUSB0 --baud=115200
```

Also update `User` and `Group`:
```ini
User=leodyversemilla07
Group=leodyversemilla07
```

Then install:

```bash
# Copy service file
sudo cp piso-print-esp32.service /etc/systemd/system/

# Create log directory
sudo mkdir -p /var/log/piso-print
sudo chown leodyversemilla07:leodyversemilla07 /var/log/piso-print

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable piso-print-esp32
sudo systemctl start piso-print-esp32

# Check status
sudo systemctl status piso-print-esp32

# View logs
sudo journalctl -u piso-print-esp32 -f
```

### 2. Print Job Monitor Service

**First, update service file paths:**

```bash
# Edit service file to use correct path
sudo nano piso-print-job-monitor.service
```

Update `WorkingDirectory` and `ExecStart` to:
```ini
WorkingDirectory=/home/leodyversemilla07/piso-print
ExecStart=/usr/bin/php /home/leodyversemilla07/piso-print/artisan print-jobs:monitor --interval=5
```

Also update `User` and `Group`:
```ini
User=leodyversemilla07
Group=leodyversemilla07
```

Then install:

```bash
# Copy service file
sudo cp piso-print-job-monitor.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable piso-print-job-monitor
sudo systemctl start piso-print-job-monitor

# Check status
sudo systemctl status piso-print-job-monitor

# View logs
sudo journalctl -u piso-print-job-monitor -f
```

### 3. Laravel Queue Worker (Optional)

```bash
# If using queues, create queue worker service
sudo nano /etc/systemd/system/piso-print-queue.service
```

**Add:**

```ini
[Unit]
Description=Piso Print Queue Worker
After=network.target

[Service]
Type=simple
User=leodyversemilla07
Group=leodyversemilla07
WorkingDirectory=/home/leodyversemilla07/piso-print
ExecStart=/usr/bin/php /home/leodyversemilla07/piso-print/artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=10
StandardOutput=append:/var/log/piso-print/queue-worker.log
StandardError=append:/var/log/piso-print/queue-worker-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable piso-print-queue
sudo systemctl start piso-print-queue
sudo systemctl status piso-print-queue
```

---

## Testing & Validation

### 1. Run Test Suite

```bash
# Run all tests
php artisan test

# Run specific test suites
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature

# Run with coverage (requires Xdebug)
php artisan test --coverage
```

### 2. Verify Services

```bash
# Check all services
sudo systemctl status piso-print-esp32
sudo systemctl status piso-print-job-monitor
sudo systemctl status cups
sudo systemctl status hostapd
sudo systemctl status dnsmasq

# Check logs
sudo journalctl -u piso-print-esp32 --since today
sudo journalctl -u piso-print-job-monitor --since today
```

### 3. Test Workflow

#### Step 1: Test Web Interface
```bash
# Production: Access via Nginx
# Open browser: http://localhost or http://raspberrypi.local

# Development: Start local development server (optional)
php artisan serve --host=0.0.0.0 --port=8000
# Access from browser: http://raspberrypi.local:8000
```

#### Step 2: Test File Upload
- Upload a test PDF file
- Verify page count extraction
- Check cost calculation

#### Step 3: Test Payment
- Insert coins through ESP32
- Verify balance updates
- Check transaction recording

#### Step 4: Test Printing
- Submit print job
- Monitor job status
- Verify page progress
- Check completed job

#### Step 5: Test Admin Dashboard
- Login to admin panel
- Verify statistics display
- Check job listing
- Test search/filter

### 4. Hardware Tests

```bash
# Test ESP32 communication
echo "COIN:5.00" | sudo tee /dev/ttyUSB0

# Test printer
lpstat -p -d
lpq -a

# Test WiFi hotspot
iwconfig wlan0
sudo iw dev wlan0 station dump
```

---

## Troubleshooting

### Common Issues

#### 1. ESP32 Not Responding

```bash
# Check USB connection
lsusb | grep CP210x

# Check serial port
ls -la /dev/ttyUSB*

# Check permissions
groups pi | grep dialout

# Restart service
sudo systemctl restart piso-print-esp32

# Check logs
sudo journalctl -u piso-print-esp32 -n 50
```

#### 2. Printer Not Found

```bash
# Check CUPS status
sudo systemctl status cups

# List printers
lpstat -p -d

# Check printer connection
lpinfo -v

# Re-add printer
sudo lpadmin -d Brother_DCP_T720DW
```

#### 3. WiFi Hotspot Not Working

```bash
# Check hostapd
sudo systemctl status hostapd
sudo hostapd -dd /etc/hostapd/hostapd.conf

# Check dnsmasq
sudo systemctl status dnsmasq
sudo dnsmasq --test

# Check interface
ip addr show wlan0
```

#### 4. Application Errors

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Check PHP errors
sudo tail -f /var/log/php8.3-fpm.log

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### 5. Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u pisoprint -p piso_print

# Check .env configuration
cat .env | grep DB_
```

### Log Locations

```bash
# Application logs
/home/leodyversemilla07/piso-print/storage/logs/laravel.log

# ESP32 service logs
sudo journalctl -u piso-print-esp32 -f
# Or: tail -f /var/log/piso-print/esp32-listener.log

# Print monitor logs
sudo journalctl -u piso-print-job-monitor -f
# Or: tail -f /var/log/piso-print/job-monitor.log

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# PHP-FPM logs
/var/log/php8.3-fpm.log

# CUPS logs
/var/log/cups/error_log
/var/log/cups/access_log

# System logs
/var/log/syslog
```

### Performance Optimization

```bash
# Optimize PHP
sudo nano /etc/php/8.3/fpm/php.ini

# Increase memory limit
memory_limit = 256M

# Enable OPcache
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

---

## Maintenance

### Daily Tasks

```bash
# Check service status
sudo systemctl status piso-print-*

# Check disk space
df -h

# Check logs for errors
sudo journalctl -p err --since today
```

### Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clean old logs
php artisan log:clear --older-than=7

# Backup database
mysqldump -u pisoprint -p piso_print > backup_$(date +%Y%m%d).sql
```

### Monthly Tasks

```bash
# Full system backup
# Clean temporary files
sudo apt autoremove -y
sudo apt autoclean -y

# Check printer maintenance
lpstat -l
```

---

## Production Checklist

### Software & Services
- [ ] PHP 8.3 installed and working
- [ ] Node.js 20 installed
- [ ] MySQL 8.0 configured
- [ ] Nginx running and configured
- [ ] CUPS printer configured
- [ ] All systemd services enabled and running:
  - [ ] piso-print-esp32
  - [ ] piso-print-job-monitor
  - [ ] nginx
  - [ ] php8.3-fpm
  - [ ] mysql
  - [ ] cups
## Support

For issues, questions, or contributions:
- **GitHub:** https://github.com/leodyversemilla07/piso-print
- **Documentation:** See `/docs` folder and `/esp32-firmware` folder
- **ESP32 Issues:** See `esp32-firmware/TESTING.md` troubleshooting section

### Additional Documentation
- **System Overview:** `docs/README.md`
- **ESP32 Firmware:** `esp32-firmware/README.md`
- **ESP32 Testing:** `esp32-firmware/TESTING.md`
- **ESP32 Wiring:** `esp32-firmware/WIRING.md`
- **Database Schema:** `docs/05_database_design.md`
- **System Architecture:** `docs/03_system_architecture.md`

---

**Version:** 1.0.0  
**Last Updated:** October 29, 2025  
**Maintainer:** Leodyver S. Semilla  
**Repository:** https://github.com/leodyversemilla07/piso-print
- [ ] ESP32 firmware flashed successfully
- [ ] ESP32 detected on `/dev/ttyUSB0`
- [ ] Serial permissions configured
- [ ] Coin acceptor programmed (1, 5, 10, 20 pulses)
- [ ] Coin detection tested
- [ ] ESP32 service logs show heartbeat

### Printer & WiFi
- [ ] Printer added to CUPS
- [ ] Test print successful
- [ ] WiFi hotspot configured and broadcasting
- [ ] USB auto-mount working

### Kiosk Mode
- [ ] Chromium installed
- [ ] Kiosk autostart configured
- [ ] Screen blanking disabled
- [ ] Mouse cursor hidden
- [ ] Kiosk launches on boot

### Security & Maintenance
- [ ] Production mode (`APP_ENV=production`, `APP_DEBUG=false`)
- [ ] Strong database password set
- [ ] Firewall configured (if needed)
- [ ] Backups configured
- [ ] Log rotation configured
- [ ] Documentation reviewed
- [ ] Emergency shutdown procedure documented

---

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/yourusername/piso-print
- Email: support@example.com
- Documentation: See `/docs` folder

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintainer:** Your Name

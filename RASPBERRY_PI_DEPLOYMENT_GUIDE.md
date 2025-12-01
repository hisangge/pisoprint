# 🍓 Piso Print - Raspberry Pi Deployment Guide

**Complete Step-by-Step Guide for Deploying Piso Print on Raspberry Pi**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Raspberry Pi Initial Setup](#2-raspberry-pi-initial-setup)
3. [System Dependencies Installation](#3-system-dependencies-installation)
4. [Database Setup (MySQL)](#4-database-setup-mysql)
5. [CUPS Printer Setup](#5-cups-printer-setup)
6. [Application Deployment](#6-application-deployment)
7. [Web Server Configuration (Nginx)](#7-web-server-configuration-nginx)
8. [ESP32 Coin Acceptor Integration](#8-esp32-coin-acceptor-integration)
9. [WiFi Hotspot Configuration](#9-wifi-hotspot-configuration)
10. [Kiosk Mode Setup](#10-kiosk-mode-setup)
11. [Systemd Services](#11-systemd-services)
12. [Testing & Verification](#12-testing--verification)
13. [Troubleshooting](#13-troubleshooting)
14. [Maintenance & Updates](#14-maintenance--updates)

---

## 1. Prerequisites

### Hardware Requirements

| Component         | Specification                                       |
| ----------------- | --------------------------------------------------- |
| **Raspberry Pi**  | Raspberry Pi 4 (4GB/8GB RAM recommended)            |
| **Storage**       | 32GB+ Class 10 microSD card                         |
| **Display**       | LAFVIN 7" Touchscreen IPS DSI Display (800×480)     |
| **ESP32**         | ESP32 Development Board (CH340C, USB-C, 30-Pin)     |
| **Coin Acceptor** | ALLAN Universal Coinslot 1239 PROMAX Multi-Coin     |
| **Printer**       | Brother DCP-T720DW (or any CUPS-compatible printer) |
| **Power**         | 5V 3A USB-C for Pi, 12V 2A for Coin Acceptor        |

### Software Requirements

- **OS**: Raspberry Pi OS (64-bit) - Debian 12 Bookworm
- **PHP**: 8.3+
- **Node.js**: 22.x LTS
- **MySQL**: 8.0+
- **Nginx**: 1.22+
- **CUPS**: Latest

---

## 2. Raspberry Pi Initial Setup

### 2.1 Flash Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Select **Raspberry Pi OS (64-bit)** - Debian Bookworm
3. Click the gear icon (⚙️) to configure:
    - Set hostname: `pisoprint`
    - Enable SSH with password authentication
    - Set username: `pisoprint`
    - Set password: `pisoprint`
    - Configure WiFi (for initial setup only)
    - Set locale and timezone: Asia/Manila
4. Flash to microSD card

### 2.2 First Boot Configuration

```bash
# Connect via SSH
ssh pisoprint@pisoprinting.connect

# Update system
sudo apt update && sudo apt upgrade -y

# Configure Raspberry Pi settings
sudo raspi-config
```

In `raspi-config`:

- **System Options > Boot / Auto Login**: Desktop Autologin
- **Interface Options > Serial Port**: Enable hardware serial
- **Interface Options > SSH**: Enable
- **Interface Options > I2C**: Enable (for touchscreen)
- **Localisation Options**: Set timezone to Asia/Manila
- **Advanced Options > Expand Filesystem**: Expand to use full SD card

```bash
# Reboot to apply changes
sudo reboot
```

### 2.3 Set Static IP (Optional but Recommended)

Edit `/etc/dhcpcd.conf`:

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:

```conf
# Static IP for Ethernet (for maintenance access)
interface eth0
    static ip_address=192.168.1.100/24
    static routers=192.168.1.1
    static domain_name_servers=8.8.8.8 8.8.4.4
```

---

## 3. System Dependencies Installation

### 3.1 Install PHP 8.3

```bash
# Add PHP repository
sudo apt install -y lsb-release apt-transport-https ca-certificates wget
wget -qO - https://packages.sury.org/php/apt.gpg | sudo tee /usr/share/keyrings/deb.sury.org-php.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/php.list

# Update and install PHP 8.3
sudo apt update
sudo apt install -y php8.3-cli php8.3-fpm php8.3-mysql php8.3-mbstring \
    php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl \
    php8.3-bcmath php8.3-readline php8.3-sqlite3

# Verify installation
php -v
```

### 3.2 Install Composer

```bash
# Download and install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 3.3 Install Node.js 22.x

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

### 3.4 Install Additional System Packages

```bash
# Install required packages
sudo apt install -y \
    nginx \
    git \
    curl \
    unzip \
    chromium-browser \
    unclutter \
    xdotool \
    onboard \
    cups \
    cups-bsd \
    cups-client \
    python3 \
    python3-pip \
    python3-serial \
    python3-requests \
    avahi-daemon \
    avahi-utils
```

---

## 4. Database Setup (MySQL)

### 4.1 Install MySQL 8.0

```bash
# Install MySQL Server
sudo apt install -y mariadb-server mariadb-client

# Secure installation
sudo mysql_secure_installation
# Follow prompts:
# - Set root password: yes
# - Remove anonymous users: yes
# - Disallow root login remotely: yes
# - Remove test database: yes
# - Reload privilege tables: yes
```

### 4.2 Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE pisoprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'pisoprint';
GRANT ALL PRIVILEGES ON pisoprint.* TO 'pisoprint'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.3 Alternative: SQLite (Simpler Setup)

If you prefer SQLite (no separate database server):

```bash
# SQLite is included with PHP, just ensure the directory is writable
touch /var/www/piso-print/database/database.sqlite
chmod 664 /var/www/piso-print/database/database.sqlite
```

Update `.env`:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/piso-print/database/database.sqlite
```

---

## 5. CUPS Printer Setup

### 5.1 Configure CUPS

```bash
# Add pisoprint user to lpadmin group
sudo usermod -a -G lpadmin pisoprint
sudo usermod -a -G lpadmin www-data

# Enable CUPS web interface
sudo cupsctl --remote-admin --remote-any --share-printers

# Start and enable CUPS
sudo systemctl enable cups
sudo systemctl start cups
```

### 5.2 Install Brother DCP-T720DW Drivers

```bash
# Download Brother drivers (ARM64)
cd /tmp
wget https://download.brother.com/welcome/dlf105450/brcupsconfig5.tar.gz
wget https://download.brother.com/welcome/dlf101775/dcpt720dwpdrv-2.0.1-1.armhf.deb

# Install driver
sudo dpkg -i dcpt720dwpdrv-2.0.1-1.armhf.deb
sudo apt --fix-broken install -y

# Configure CUPS
tar -xvzf brcupsconfig5.tar.gz
sudo ./brcupsconfig5/brcupsconfig5
```

### 5.3 Add Printer via Web Interface

1. Open browser: `http://localhost:631`
2. Go to **Administration** > **Add Printer**
3. Select USB printer: "Brother DCP-T720DW"
4. Set name: `Brother_DCP_T720DW_USB`
5. Make default printer

### 5.4 Verify Printer

```bash
# List printers
lpstat -p -d

# Test print
echo "Test Print from Piso Print Kiosk" | lp -d Brother_DCP_T720DW_USB

# Or print a test page
lp -d Brother_DCP_T720DW_USB /usr/share/cups/data/testprint
```

---

## 6. Application Deployment

### 6.1 Clone Repository

```bash
# Create web directory
sudo mkdir -p /var/www/piso-print
sudo chown -R pisoprint:www-data /var/www/piso-print

# Clone repository
cd /var/www
git clone https://github.com/hisangge/pisoprint.git piso-print
cd piso-print
```

### 6.2 Install PHP Dependencies

```bash
# Install production dependencies
composer install --no-dev --optimize-autoloader
```

### 6.3 Install Node Dependencies & Build Assets

```bash
# Install npm packages (with ARM64 optimizations)
npm ci

# Build production assets
npm run build
```

### 6.4 Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit environment file
nano .env
```

Update `.env` for production:

```env
APP_NAME=PisoPrint
APP_ENV=production
APP_DEBUG=false
APP_URL=http://pisoprinting.connect

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pisoprint
DB_USERNAME=pisoprint
DB_PASSWORD=pisoprint

# Session & Queue
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Hardware Configuration (PRODUCTION - disable mocks)
ESP32_ID=ESP32_COIN_001
ESP32_SERIAL_PORT=/dev/ttyUSB0
ESP32_BAUD_RATE=115200
ESP32_HEARTBEAT_TIMEOUT=30
ESP32_MOCK_ENABLED=false

# Printer Configuration (PRODUCTION)
PRINTER_NAME=Brother_DCP_T720DW_USB
PRINTER_MOCK_ENABLED=false

# CUPS Configuration
PRINTING_DRIVER=cups
PRINTING_DEFAULT_PRINTER_ID=Brother_DCP_T720DW_USB
CUPS_SERVER_IP=localhost
CUPS_SERVER_PORT=631
CUPS_SERVER_USERNAME=pisoprint
CUPS_SERVER_PASSWORD=pisoprint
CUPS_SERVER_SECURE=false

# Printing Prices (in Pesos)
PRICE_PER_PAGE_BW=2.00
PRICE_PER_PAGE_GRAYSCALE=3.00
PRICE_PER_PAGE_COLOR=5.00

# USB Configuration
USB_MOUNT_POINT=/mnt/usb

# WiFi Hotspot Configuration
WIFI_SSID=PisoPrint_Kiosk
WIFI_PASSWORD=PisoPrint2025
WIFI_IP=192.168.4.1
WIFI_DHCP_RANGE=192.168.4.100,192.168.4.200

# Kiosk Domain
KIOSK_DOMAIN=pisoprinting.connect
```

### 6.5 Run Database Migrations

```bash
# Run migrations
php artisan migrate --force

# Create storage symlink
php artisan storage:link

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 6.6 Set Permissions

```bash
# Set ownership
sudo chown -R pisoprint:www-data /var/www/piso-print
sudo chmod -R 755 /var/www/piso-print
sudo chmod -R 775 /var/www/piso-print/storage
sudo chmod -R 775 /var/www/piso-print/bootstrap/cache

# Grant serial port access
sudo usermod -a -G dialout www-data
sudo usermod -a -G dialout pisoprint
```

### 6.7 Setup USB Drive Auto-Detection

This section configures automatic USB flash drive detection and mounting for PDF file uploads.

#### 6.7.1 Create USB Mount Directory

```bash
# Create mount point directory
sudo mkdir -p /mnt/usb
sudo chown pisoprint:www-data /mnt/usb
sudo chmod 775 /mnt/usb
```

#### 6.7.2 Install USB Automount Dependencies

```bash
# Install required packages
sudo apt install -y usbmount udisks2 ntfs-3g exfat-fuse exfat-utils
```

#### 6.7.3 Create USB Manager Script

```bash
# Copy the USB manager script
sudo cp /var/www/piso-print/scripts/usb-manager.sh /usr/local/bin/usb-manager.sh
sudo chmod +x /usr/local/bin/usb-manager.sh
```

#### 6.7.4 Create Udev Rules for USB Detection

```bash
# Create udev rule for USB storage devices
sudo nano /etc/udev/rules.d/99-usb-automount.rules
```

Add the following content:

```udev
# Piso Print USB Auto-Mount Rules
# Triggers on USB storage device insertion/removal

# When USB storage device is added
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_TYPE}!="", ENV{ID_BUS}=="usb", \
    RUN+="/usr/local/bin/usb-manager.sh add %k"

# When USB storage device is removed
ACTION=="remove", SUBSYSTEM=="block", ENV{ID_BUS}=="usb", \
    RUN+="/usr/local/bin/usb-manager.sh remove %k"
```

#### 6.7.5 Create Systemd Service for USB Events (Alternative Method)

```bash
# Create systemd service template for USB mount
sudo nano /etc/systemd/system/usb-mount@.service
```

Add:

```ini
[Unit]
Description=Mount USB Drive %i
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/usb-manager.sh add %i
ExecStop=/usr/local/bin/usb-manager.sh remove %i

[Install]
WantedBy=multi-user.target
```

#### 6.7.6 Update USB Manager Script for Raspberry Pi

Edit the USB manager script to use the correct paths:

```bash
sudo nano /usr/local/bin/usb-manager.sh
```

Ensure it contains:

```bash
#!/bin/bash

# Configuration for Raspberry Pi
MOUNT_ROOT="/mnt/usb"
API_URL="http://127.0.0.1/api/kiosk/usb/detected"
LOG_FILE="/var/log/usb-manager.log"
WEB_UID=$(id -u www-data)
WEB_GID=$(id -g www-data)

ACTION=$1
DEVICE_NAME=$2

DEVICE_PATH="/dev/$DEVICE_NAME"
MOUNT_POINT="$MOUNT_ROOT/$DEVICE_NAME"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

if [ "$ACTION" == "add" ]; then
    # Wait for device to be ready
    sleep 2

    # Create mount point
    mkdir -p "$MOUNT_POINT"

    # Detect filesystem type
    FSTYPE=$(blkid -o value -s TYPE "$DEVICE_PATH" 2>/dev/null)

    # Mount based on filesystem type
    case "$FSTYPE" in
        vfat|fat32|fat16)
            mount -t vfat -o uid=$WEB_UID,gid=$WEB_GID,umask=0022,utf8 "$DEVICE_PATH" "$MOUNT_POINT"
            ;;
        ntfs)
            mount -t ntfs-3g -o uid=$WEB_UID,gid=$WEB_GID,umask=0022 "$DEVICE_PATH" "$MOUNT_POINT"
            ;;
        exfat)
            mount -t exfat -o uid=$WEB_UID,gid=$WEB_GID,umask=0022 "$DEVICE_PATH" "$MOUNT_POINT"
            ;;
        ext4|ext3|ext2)
            mount "$DEVICE_PATH" "$MOUNT_POINT"
            chown -R www-data:www-data "$MOUNT_POINT"
            ;;
        *)
            mount "$DEVICE_PATH" "$MOUNT_POINT"
            ;;
    esac

    if [ $? -eq 0 ]; then
        log "SUCCESS: Mounted $DEVICE_NAME ($FSTYPE) to $MOUNT_POINT"

        # Notify Laravel application
        curl -s -X POST "$API_URL" \
             -H "Content-Type: application/json" \
             -d "{\"device\":\"$DEVICE_NAME\", \"status\":\"mounted\", \"mount_point\":\"$MOUNT_POINT\"}" \
             --max-time 5 > /dev/null 2>&1 &
    else
        log "ERROR: Failed to mount $DEVICE_NAME"
        rmdir "$MOUNT_POINT" 2>/dev/null
    fi

elif [ "$ACTION" == "remove" ]; then
    # Unmount and cleanup
    umount -l "$MOUNT_POINT" 2>/dev/null
    rmdir "$MOUNT_POINT" 2>/dev/null
    log "SUCCESS: Unmounted $DEVICE_NAME"

    # Notify Laravel application
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"device\":\"$DEVICE_NAME\", \"status\":\"removed\"}" \
         --max-time 5 > /dev/null 2>&1 &
fi
```

#### 6.7.7 Set Permissions and Reload Rules

```bash
# Set execute permission
sudo chmod +x /usr/local/bin/usb-manager.sh

# Create log file with proper permissions
sudo touch /var/log/usb-manager.log
sudo chown pisoprint:www-data /var/log/usb-manager.log
sudo chmod 664 /var/log/usb-manager.log

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

#### 6.7.8 Test USB Detection

```bash
# Insert a USB flash drive and check:

# 1. Check if device is detected
lsblk

# 2. Check mount point
ls -la /mnt/usb/

# 3. Check log file
tail -f /var/log/usb-manager.log

# 4. Manually test the script
sudo /usr/local/bin/usb-manager.sh add sda1
ls -la /mnt/usb/sda1/

# 5. Check Laravel detected the USB
curl http://localhost/api/kiosk/usb/check-status
```

#### 6.7.9 Update Environment Configuration

Make sure `.env` has the correct USB mount point:

```bash
# In /var/www/piso-print/.env
USB_MOUNT_POINT=/mnt/usb
```

---

## 7. Web Server Configuration (Nginx)

### 7.1 Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/piso-print
```

Add the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pisoprinting.connect 192.168.4.1 localhost;

    root /var/www/piso-print/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Handle uploaded files (max 50MB)
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM configuration
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;

        # Increase timeouts for long operations
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
    }

    # Deny access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.2 Enable Site and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/piso-print /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7.3 Configure PHP-FPM

```bash
# Edit PHP-FPM pool configuration
sudo nano /etc/php/8.3/fpm/pool.d/www.conf
```

Update these settings:

```ini
user = www-data
group = www-data

; Increase process limits for better performance
pm = dynamic
pm.max_children = 10
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
pm.max_requests = 500
```

```bash
# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
sudo systemctl enable php8.3-fpm
```

---

## 8. ESP32 Coin Acceptor Integration

### 8.1 Flash ESP32 Firmware

1. Connect ESP32 to your development computer via USB
2. Install PlatformIO IDE or Arduino IDE
3. Open `/esp32-firmware/piso-print-coin-acceptor/` project
4. Update WiFi credentials if needed
5. Upload firmware to ESP32

### 8.2 Wire ESP32 to Raspberry Pi

```
ESP32 Pin     →    Raspberry Pi Pin
─────────────────────────────────────
GPIO 17 (TX)  →    GPIO 15 (RXD0) - Pin 10
GPIO 16 (RX)  →    GPIO 14 (TXD0) - Pin 8
GND           →    GND - Pin 6
5V            →    External 5V (not from Pi)
```

### 8.3 Wire Coin Acceptor to ESP32

```
Coin Acceptor     →    ESP32
─────────────────────────────
+12V (Red)        →    External 12V Power
GND (Black)       →    GND (shared with Pi)
COIN (White)      →    GPIO 25
```

### 8.4 Configure Serial Port

```bash
# Enable UART on Raspberry Pi
sudo raspi-config
# Interface Options > Serial Port
# Login shell over serial: NO
# Serial port hardware: YES

# Disable Bluetooth (uses same UART)
echo "dtoverlay=disable-bt" | sudo tee -a /boot/config.txt

# Set permissions
sudo chmod 666 /dev/ttyUSB0
sudo chmod 666 /dev/serial0

# Reboot
sudo reboot
```

### 8.5 Install Python Coin Listener

```bash
# Install Python dependencies
cd /var/www/piso-print/scripts
pip3 install -r requirements.txt

# Test coin listener
python3 coin_listener.py --port /dev/ttyUSB0
```

---

## 9. WiFi Hotspot Configuration

### 9.1 Install Required Packages

```bash
sudo apt install -y hostapd dnsmasq iptables-persistent rfkill
```

### 9.2 Run Setup Script

```bash
cd /var/www/piso-print/scripts
sudo bash wifi-manager.sh setup
```

Or configure manually:

### 9.3 Manual WiFi Hotspot Configuration

```bash
# Stop services
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# Configure static IP for wlan0
sudo nano /etc/dhcpcd.conf
```

Add:

```conf
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

```bash
# Configure dnsmasq
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
sudo nano /etc/dnsmasq.conf
```

Add:

```conf
interface=wlan0
dhcp-range=192.168.4.100,192.168.4.200,255.255.255.0,24h
domain=wlan
address=/pisoprinting.connect/192.168.4.1
server=8.8.8.8
server=8.8.4.4
```

```bash
# Configure hostapd
sudo nano /etc/hostapd/hostapd.conf
```

Add:

```conf
interface=wlan0
driver=nl80211
ssid=PisoPrint_Kiosk
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=PisoPrint2025
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
country_code=PH
```

```bash
# Point hostapd to config file
sudo nano /etc/default/hostapd
# Set: DAEMON_CONF="/etc/hostapd/hostapd.conf"

# Unmask and enable services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

# Restart services
sudo systemctl restart dhcpcd
sudo systemctl start hostapd
sudo systemctl start dnsmasq
```

### 9.4 Setup mDNS (pisoprinting.connect)

```bash
cd /var/www/piso-print/scripts
sudo bash mdns-setup.sh
```

---

## 10. Kiosk Mode Setup

### 10.1 Create Kiosk Startup Script

```bash
# Copy kiosk script
sudo cp /var/www/piso-print/start-kiosk.sh /home/pisoprint/start-kiosk.sh
sudo chmod +x /home/pisoprint/start-kiosk.sh
sudo chown pisoprint:pisoprint /home/pisoprint/start-kiosk.sh
```

### 10.2 Configure Autostart

```bash
# Create autostart directory
mkdir -p /home/pisoprint/.config/autostart

# Create desktop entry for autostart
cat > /home/pisoprint/.config/autostart/piso-print-kiosk.desktop << EOF
[Desktop Entry]
Type=Application
Name=Piso Print Kiosk
Exec=/home/pisoprint/start-kiosk.sh
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
```

### 10.3 Disable Screen Blanking

```bash
# Create lightdm config
sudo mkdir -p /etc/lightdm/lightdm.conf.d
sudo nano /etc/lightdm/lightdm.conf.d/50-no-screensaver.conf
```

Add:

```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

### 10.4 Create Exit Kiosk Script (For Maintenance)

```bash
cat > /home/pisoprint/exit-kiosk.sh << 'EOF'
#!/bin/bash
pkill -f chromium-browser
pkill -f start-kiosk
pkill -f unclutter
echo "Kiosk mode exited. Access desktop now."
EOF

chmod +x /home/pisoprint/exit-kiosk.sh
```

---

## 11. Systemd Services

### 11.1 Laravel Queue Worker Service

```bash
sudo nano /etc/systemd/system/laravel-queue.service
```

```ini
[Unit]
Description=Laravel Queue Worker for Piso Print
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/piso-print
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 11.2 Coin Listener Service

```bash
sudo nano /etc/systemd/system/coin-listener.service
```

```ini
[Unit]
Description=Piso Print ESP32 Coin Listener
After=network.target

[Service]
Type=simple
User=pisoprint
WorkingDirectory=/var/www/piso-print/scripts
Environment=ESP32_SERIAL_PORT=/dev/ttyUSB0
Environment=LARAVEL_URL=http://localhost
ExecStart=/usr/bin/python3 coin_listener.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 11.3 Enable All Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable nginx
sudo systemctl enable php8.3-fpm
sudo systemctl enable mariadb
sudo systemctl enable cups
sudo systemctl enable laravel-queue
sudo systemctl enable coin-listener
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq
sudo systemctl enable avahi-daemon

# Start services
sudo systemctl start nginx
sudo systemctl start php8.3-fpm
sudo systemctl start mariadb
sudo systemctl start cups
sudo systemctl start laravel-queue
sudo systemctl start coin-listener
sudo systemctl start hostapd
sudo systemctl start dnsmasq
sudo systemctl start avahi-daemon
```

### 11.4 Check Service Status

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mariadb
sudo systemctl status cups
sudo systemctl status laravel-queue
sudo systemctl status coin-listener
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

---

## 12. Testing & Verification

### 12.1 Test Web Application

```bash
# Test from Pi
curl -I http://localhost
curl -I http://192.168.4.1
curl -I http://pisoprinting.connect
```

### 12.2 Test Printer

```bash
# Check printer status
lpstat -p -d

# Print test page
lp -d Brother_DCP_T720DW_USB /usr/share/cups/data/testprint

# Test from Laravel
php artisan tinker
>>> App\Services\PrintService::printTestPage();
```

### 12.3 Test Coin Acceptor

```bash
# Check coin listener logs
sudo journalctl -u coin-listener -f

# Insert test coin and verify
# - ESP32 LED should blink
# - Coin listener should log "Coin ₱X.XX deposited"
# - Web UI should update balance
```

### 12.4 Test WiFi Hotspot

From your phone/laptop:

1. Scan for WiFi networks
2. Connect to `PisoPrint_Kiosk`
3. Enter password: `PisoPrint2025`
4. Open browser: `http://192.168.4.1` or `http://pisoprinting.connect`

### 12.5 Test USB Drive Detection

```bash
# Insert a USB flash drive with PDF files

# 1. Check if device is detected
lsblk
# Should show sda1 or similar

# 2. Check if mounted
ls -la /mnt/usb/
# Should show sda1 folder

# 3. Check mount log
tail /var/log/usb-manager.log

# 4. List PDF files on USB
find /mnt/usb -name "*.pdf" -o -name "*.PDF"

# 5. Test from web browser
# Navigate to USB upload option in kiosk
# PDF files from USB should be listed
```

### 12.6 Full System Test

1. Power on Raspberry Pi
2. Wait for kiosk mode to launch (Chromium opens automatically)
3. Connect phone to WiFi hotspot
4. Upload a PDF file from phone
5. **OR** Insert USB drive with PDF files
6. Insert coins to add balance
7. Select print options
8. Print document
9. Verify output quality

---

## 13. Troubleshooting

### 13.1 Web Application Not Loading

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check PHP-FPM logs
sudo tail -f /var/log/php8.3-fpm.log

# Check Laravel logs
tail -f /var/www/piso-print/storage/logs/laravel.log

# Test PHP
php -v

# Clear Laravel cache
cd /var/www/piso-print
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 13.2 Printer Not Working

```bash
# Check CUPS status
sudo systemctl status cups
lpstat -p -d

# View CUPS error log
sudo tail -f /var/log/cups/error_log

# Restart CUPS
sudo systemctl restart cups

# Check printer connection
lsusb | grep Brother
```

### 13.3 Coin Acceptor Not Detecting

```bash
# Check serial port
ls -la /dev/ttyUSB*
ls -la /dev/serial*

# Check permissions
sudo chmod 666 /dev/ttyUSB0

# Test serial connection
python3 -c "import serial; s = serial.Serial('/dev/ttyUSB0', 115200); print('Connected!')"

# Check coin listener service
sudo journalctl -u coin-listener -f

# Restart coin listener
sudo systemctl restart coin-listener
```

### 13.4 USB Drive Not Detected

```bash
# Check if USB device is recognized by system
lsblk
# Look for devices like sda, sda1, sdb, sdb1

# Check dmesg for USB events
dmesg | tail -20

# Check if udev rules are loaded
sudo udevadm info --query=all --name=/dev/sda1

# Test USB manager script manually
sudo /usr/local/bin/usb-manager.sh add sda1
ls -la /mnt/usb/sda1/

# Check USB manager log
tail -f /var/log/usb-manager.log

# Verify mount point permissions
ls -la /mnt/usb/

# Check if www-data can read USB files
sudo -u www-data ls -la /mnt/usb/sda1/

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# Check if exfat/ntfs support is installed
dpkg -l | grep -E 'ntfs|exfat'

# Install missing filesystem support
sudo apt install -y ntfs-3g exfat-fuse exfat-utils
```

**Common USB Issues:**

| Issue                     | Solution                                              |
| ------------------------- | ----------------------------------------------------- |
| USB not mounting          | Check filesystem type, install ntfs-3g or exfat-fuse  |
| Permission denied         | Ensure mount uses uid/gid of www-data                 |
| PDF files not visible     | Check allowed extensions in hardware.php config       |
| USB detected but no files | Verify mount point in .env (USB_MOUNT_POINT=/mnt/usb) |
| Slow USB response         | Check USB cable quality, try different USB port       |

### 13.5 WiFi Hotspot Not Broadcasting

```bash
# Check hostapd status
sudo systemctl status hostapd

# View hostapd logs
sudo journalctl -u hostapd -f

# Check wireless interface
iwconfig wlan0
ip addr show wlan0

# Restart WiFi services
sudo systemctl restart dhcpcd
sudo systemctl restart hostapd
sudo systemctl restart dnsmasq

# Unblock WiFi
sudo rfkill unblock wifi
```

### 13.6 Kiosk Not Starting

```bash
# Check display
echo $DISPLAY

# Test Chromium manually
chromium-browser --kiosk http://localhost

# Check kiosk script
cat /home/pisoprint/start-kiosk.sh

# Check autostart
ls -la /home/pisoprint/.config/autostart/

# View system logs
journalctl -b | grep -i chromium
```

### 13.7 Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mariadb

# Test connection
mysql -u pisoprint -ppisoprint pisoprint -e "SELECT 1;"

# Check Laravel database config
php artisan tinker
>>> DB::connection()->getPdo();

# Run migrations
php artisan migrate --force
```

---

## 14. Maintenance & Updates

### 14.1 Regular Maintenance Tasks

```bash
# Weekly: Update system packages
sudo apt update && sudo apt upgrade -y

# Weekly: Clear old logs
sudo journalctl --vacuum-time=7d

# Weekly: Clear Laravel logs older than 7 days
find /var/www/piso-print/storage/logs -type f -mtime +7 -delete

# Monthly: Database optimization
mysql -u pisoprint -ppisoprint pisoprint -e "OPTIMIZE TABLE print_jobs, transactions, users;"

# Check disk space
df -h
```

### 14.2 Application Updates

```bash
cd /var/www/piso-print

# Backup database
mysqldump -u pisoprint -ppisoprint pisoprint > /home/pisoprint/backup_$(date +%Y%m%d).sql

# Pull latest changes
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Run migrations
php artisan migrate --force

# Clear and rebuild cache
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Restart services
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
sudo systemctl restart laravel-queue
```

### 14.3 Backup Script

Create `/home/pisoprint/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/pisoprint/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u pisoprint -ppisoprint pisoprint > $BACKUP_DIR/db_$DATE.sql

# Backup .env file
cp /var/www/piso-print/.env $BACKUP_DIR/env_$DATE

# Backup uploaded files
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/piso-print/storage/app

# Keep only last 7 backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /home/pisoprint/backup.sh

# Add to cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/pisoprint/backup.sh") | crontab -
```

### 14.4 Monitoring Commands

```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# Network connections
netstat -tulpn

# Laravel logs
tail -f /var/www/piso-print/storage/logs/laravel.log

# All service status
sudo systemctl list-units --type=service --state=running | grep -E 'nginx|php|mysql|cups|coin|queue|hostapd|dnsmasq'
```

---

## Quick Reference

### Important Paths

| Path                                    | Description                |
| --------------------------------------- | -------------------------- |
| `/var/www/piso-print`                   | Application root           |
| `/var/www/piso-print/.env`              | Environment configuration  |
| `/var/www/piso-print/storage/logs`      | Application logs           |
| `/etc/nginx/sites-available/piso-print` | Nginx configuration        |
| `/etc/hostapd/hostapd.conf`             | WiFi hotspot configuration |
| `/home/pisoprint/start-kiosk.sh`        | Kiosk startup script       |

### Important Commands

| Command                         | Description             |
| ------------------------------- | ----------------------- |
| `php artisan migrate`           | Run database migrations |
| `php artisan optimize`          | Cache configuration     |
| `php artisan queue:work`        | Process queue jobs      |
| `lpstat -p -d`                  | Check printer status    |
| `sudo systemctl restart nginx`  | Restart web server      |
| `/home/pisoprint/exit-kiosk.sh` | Exit kiosk mode         |

### Default Credentials

| Service      | Username  | Password      |
| ------------ | --------- | ------------- |
| WiFi Hotspot | -         | PisoPrint2025 |
| MySQL        | pisoprint | pisoprint     |
| SSH          | pisoprint | pisoprint     |
| CUPS Admin   | pisoprint | pisoprint     |

### Network Information

| Service    | Address                                           |
| ---------- | ------------------------------------------------- |
| Web App    | http://192.168.4.1 or http://pisoprinting.connect |
| CUPS Web   | http://localhost:631                              |
| WiFi SSID  | PisoPrint_Kiosk                                   |
| Hotspot IP | 192.168.4.1                                       |

---

## Support

For issues and questions:

- **GitHub Issues**: https://github.com/hisangge/pisoprint/issues
- **Email**: leodyversemilla07@gmail.com

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**© 2025 Piso Print System. All rights reserved.**

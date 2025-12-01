# Raspberry Pi Deployment Guide

## Complete Step-by-Step Deployment Process

This document provides a detailed walkthrough of deploying the Piso Print application on a Raspberry Pi 4 with a 7-inch touchscreen, based on actual deployment experience.

---

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Pre-Deployment Preparation](#pre-deployment-preparation)
3. [System Software Installation](#system-software-installation)
4. [Application Deployment](#application-deployment)
5. [Kiosk Mode Setup](#kiosk-mode-setup)
6. [Touch Scrolling Configuration](#touch-scrolling-configuration)
7. [Hardware Integration](#hardware-integration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Hardware Requirements

### Confirmed Working Configuration

- **Device:** Raspberry Pi 4 (8GB RAM recommended, 4GB minimum)
- **Architecture:** aarch64/ARM64
- **Display:** 7-inch DSI touchscreen (800×480 resolution)
- **Touch Controller:** ft5x06 capacitive touchscreen
- **Storage:** 32GB+ microSD card (Class 10 or better)
- **Network:** Ethernet or WiFi connection
- **Optional Hardware:**
  - ESP32 for coin acceptor (connected via USB)
  - Epson M1110 or Brother DCP-T720DW printer (network or USB)
  - USB flash drives for file uploads

### Operating System

- **Raspberry Pi OS:** 64-bit (Debian 13 Trixie or later)
- **Kernel:** 6.12.47 or later
- **Desktop:** X11 (not Wayland)

---

## Pre-Deployment Preparation

### 1. Fix Known Issues on Development Machine

Before deploying, ensure your codebase is free of errors:

**Issue 1: JavaScript Syntax Error in app.blade.php**

Edit `resources/views/app.blade.php` (around line 85-86):

```blade
<!-- BEFORE (incorrect - duplicate braces) -->
@routes }}
@inertiaHead
</head>

<!-- AFTER (correct) -->
@routes
@inertiaHead
</head>
```

**Issue 2: Missing Favicon Reference**

Remove or update favicon reference (around line 48):

```blade
<!-- Remove this line if favicon doesn't exist -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
```

**Commit and Push Changes:**

```bash
git add resources/views/app.blade.php
git commit -m "fix: remove duplicate braces and favicon reference"
git push origin main
```

### 2. Setup SSH Access on Raspberry Pi

On your development machine, create SSH key if needed:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to Raspberry Pi
ssh-copy-id leodyversemilla07@192.168.1.15
```

### 3. Setup GitHub SSH Key on Raspberry Pi

```bash
# On Raspberry Pi
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy the output and add to GitHub: Settings > SSH and GPG keys
```

---

## System Software Installation

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install PHP 8.3 (via Sury Repository)

The default Raspberry Pi OS repository may have older PHP versions. Use Sury's repository for PHP 8.3:

```bash
# Install prerequisites
sudo apt install -y lsb-release apt-transport-https ca-certificates wget

# Add Sury PHP repository
sudo wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/php.list

# Update and install PHP 8.3
sudo apt update
sudo apt install -y php8.3 php8.3-cli php8.3-fpm php8.3-common \
    php8.3-mysql php8.3-mbstring php8.3-xml php8.3-bcmath \
    php8.3-curl php8.3-gd php8.3-zip php8.3-intl php8.3-soap

# Verify installation
php -v
# Expected: PHP 8.3.26 (cli)
```

### 3. Install MariaDB (MySQL-compatible)

MySQL server package is not available on Raspberry Pi OS. Use MariaDB instead:

```bash
# Install MariaDB
sudo apt install -y mariadb-server mariadb-client

# Start and enable service
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure installation
sudo mysql_secure_installation
# Follow prompts:
# - Set root password
# - Remove anonymous users: Yes
# - Disallow root login remotely: Yes
# - Remove test database: Yes
# - Reload privilege tables: Yes

# Verify installation
mysql --version
# Expected: mysql Ver 15.1 Distrib 11.8.3-MariaDB
```

### 4. Install Nginx Web Server

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable service
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
# Expected: nginx version: nginx/1.26.0 or later
```

### 5. Install Node.js 20 (via NVM)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node -v
# Expected: v20.19.5 or later
npm -v
# Expected: 10.x.x or later
```

### 6. Install Composer

```bash
# Download and install Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"

# Verify installation
composer --version
# Expected: Composer version 2.8.12 or later
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone git@github.com:leodyversemilla07/piso-print.git

# Navigate to project
cd piso-print
```

### 2. Install PHP Dependencies

```bash
# Install Composer dependencies (production mode)
composer install --no-dev --optimize-autoloader

# Expected output: 134+ packages installed
```

### 3. Install and Build Frontend Assets

**Important: ARM64 Architecture Fix**

The first build may fail with "Illegal instruction" error on ARM64. Use this workaround:

```bash
# Install npm dependencies
npm install

# If build fails with "Illegal instruction", run:
rm -rf node_modules
npm install --force --arch=arm64

# Build frontend assets
npm run build

# Expected output: 73+ assets generated in public/build/
```

### 4. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env file
nano .env
```

**Required .env Configuration:**

```env
APP_NAME="Piso Print"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY
APP_DEBUG=false
APP_TIMEZONE=Asia/Manila
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=piso_print
DB_USERNAME=pisoprint
DB_PASSWORD=your_secure_password

# Hardware Configuration
ESP32_SERIAL_PORT=/dev/ttyUSB0
ESP32_BAUD_RATE=115200

# WiFi Hotspot (optional)
WIFI_HOTSPOT_ENABLED=true
WIFI_SSID=PisoPrint_Kiosk
WIFI_PASSWORD=PisoPrint2025
WIFI_IP_ADDRESS=192.168.4.1
```

### 5. Setup Database

```bash
# Login to MariaDB as root
sudo mysql

# Create database and user
CREATE DATABASE piso_print CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON piso_print.* TO 'pisoprint'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
php artisan migrate --force

# Expected: 11 tables created (users, transactions, print_jobs, etc.)
```

### 6. Configure Nginx

```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/piso-print
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name localhost 192.168.1.15;

    root /home/leodyversemilla07/piso-print/public;
    index index.php index.html;

    # Logging
    access_log /var/log/piso-print/access.log;
    error_log /var/log/piso-print/error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Main location block
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP handling
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Create log directory
sudo mkdir -p /var/log/piso-print
sudo chown www-data:www-data /var/log/piso-print

# Enable site
sudo ln -s /etc/nginx/sites-available/piso-print /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Fix Permissions

**Critical: Nginx needs execute permission on home directory**

```bash
# Give execute permission to home directory
chmod +x /home/leodyversemilla07

# Set proper ownership
sudo chown -R leodyversemilla07:www-data /home/leodyversemilla07/piso-print/storage
sudo chown -R leodyversemilla07:www-data /home/leodyversemilla07/piso-print/bootstrap/cache

# Set directory permissions
sudo chmod -R 775 /home/leodyversemilla07/piso-print/storage
sudo chmod -R 775 /home/leodyversemilla07/piso-print/bootstrap/cache
```

### 8. Verify Deployment

```bash
# Check all services are running
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mariadb

# Test web access
curl http://localhost

# Expected: HTML output from Laravel application
```

**Access via Browser:**
- Local: http://localhost
- Network: http://192.168.1.15

---

## Kiosk Mode Setup

### 1. Install Desktop Environment

```bash
# Install minimal desktop environment
sudo apt install -y xserver-xorg x11-xserver-utils xinit lightdm
sudo apt install -y chromium-browser
sudo apt install -y unclutter  # Hide mouse cursor

# Install emoji fonts (required for proper emoji rendering)
sudo apt install -y fonts-noto-color-emoji

# Note: Do NOT install full lxde-core if you want minimal setup
```

### 2. Switch to X11 (Important for Touch Support)

**Wayland does not support touch scrolling properly. Use X11 instead:**

```bash
# Switch to X11
sudo raspi-config nonint do_wayland W1

# Reboot to apply
sudo reboot
```

After reboot, verify X11 is active:

```bash
echo $XDG_SESSION_TYPE
# Expected: "tty" or "x11" (NOT "wayland")
```

### 3. Configure Auto-Login

```bash
# Edit lightdm configuration
sudo nano /etc/lightdm/lightdm.conf
```

**Add/modify these lines:**

```ini
[Seat:*]
autologin-user=leodyversemilla07
autologin-user-timeout=0
user-session=LXDE-pi
```

```bash
# Add user to autologin group
sudo groupadd -r autologin
sudo gpasswd -a leodyversemilla07 autologin
```

### 4. Create Kiosk Startup Script

```bash
# Create startup script
nano ~/start-kiosk.sh
```

**Script content:**

```bash
#!/bin/bash

# Set display
export DISPLAY=:0

# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Hide mouse cursor
unclutter -idle 0.1 &

# Kill panel/taskbar for fullscreen
killall lxpanel 2>/dev/null

# Wait for X11 to be ready
sleep 5

# Start Chromium in kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --disable-session-crashed-bubble \
    --disable-component-update \
    --check-for-update-interval=31536000 \
    --disable-features=TranslateUI \
    --touch-events=enabled \
    --enable-smooth-scrolling \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --enable-features=OverlayScrollbar \
    http://localhost
```

```bash
# Make executable
chmod +x ~/start-kiosk.sh
```

### 5. Configure Autostart

```bash
# Create autostart directory
mkdir -p ~/.config/autostart

# Create autostart entry
nano ~/.config/autostart/piso-print-kiosk.desktop
```

**Desktop entry content:**

```ini
[Desktop Entry]
Type=Application
Name=Piso Print Kiosk
Exec=/home/leodyversemilla07/start-kiosk.sh
X-GNOME-Autostart-enabled=true
```

### 6. Configure 7-inch Display

The 7-inch DSI touchscreen should be auto-detected. Verify:

```bash
# Check display configuration
DISPLAY=:0 xrandr

# Expected output:
# DSI-1 connected 800x480+0+0 60.03Hz
```

### 7. Verify Touch Device

```bash
# List input devices
DISPLAY=:0 xinput list

# Expected output should include:
# ↳ 10-0038 generic ft5x06 (79)    id=6    [slave pointer]
```

---

## Touch Scrolling Configuration

### 1. Add Touch Scrolling CSS

Edit `resources/css/app.css` and add:

```css
/* Enable smooth touch scrolling on mobile/touchscreen */
html {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
}

body {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
}

/* Apply to all scrollable elements */
* {
    -webkit-overflow-scrolling: touch;
}

/* Specific scrollable containers */
.overflow-auto,
.overflow-y-auto,
.overflow-x-auto,
[style*="overflow: auto"],
[style*="overflow-y: auto"],
[style*="overflow-x: auto"] {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y pan-x;
}
```

### 2. Rebuild Frontend Assets

```bash
cd ~/piso-print
npm run build
```

### 3. Clear Laravel Cache

```bash
php artisan view:clear
php artisan config:clear
php artisan cache:clear
```

### 4. Restart Chromium

```bash
# Kill existing Chromium process
DISPLAY=:0 killall chromium-browser

# Start kiosk mode again
DISPLAY=:0 ~/start-kiosk.sh &
```

### 5. Test Touch Scrolling

On the 7-inch touchscreen:
- Single tap should work (buttons, links)
- Swipe up/down should scroll smoothly
- Two-finger gestures should be disabled (no pinch zoom)

---

## Hardware Integration

### 1. ESP32 Coin Acceptor Setup

**When hardware is available:**

```bash
# Add user to dialout group for serial access
sudo usermod -a -G dialout leodyversemilla07

# Logout and login for group change to take effect
# Or reboot: sudo reboot

# Flash ESP32 firmware
cd ~/piso-print/esp32-firmware
# Follow instructions in esp32-firmware/README.md

# Install systemd service
sudo cp ~/piso-print/piso-print-esp32.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable piso-print-esp32
sudo systemctl start piso-print-esp32

# Check status
sudo systemctl status piso-print-esp32
```

### 2. CUPS Printer Configuration

**Supported Printers:** Epson M1110, Brother DCP-T720DW, and other CUPS-compatible printers

#### Epson M1110 Setup:

```bash
# Install CUPS and Epson printer drivers
sudo apt install -y cups cups-client printer-driver-escpr

# Add user to lpadmin group
sudo usermod -a -G lpadmin leodyversemilla07

# Start CUPS service
sudo systemctl start cups
sudo systemctl enable cups

# Access CUPS web interface
# Open browser: http://localhost:631

# Add printer via web interface:
# 1. Administration > Add Printer
# 2. Select Epson M1110
# 3. Set as default printer

# Or via command line:
sudo lpadmin -p Epson-M1110 -E -v usb://EPSON/M1110 -m everywhere
sudo lpadmin -d Epson-M1110

# Test print
echo "Test print from Piso Print" | lp
```

#### Brother DCP-T720DW Setup:

```bash
# Install CUPS and Brother printer drivers
sudo apt install -y cups cups-client printer-driver-brlaser

# Add user to lpadmin group
sudo usermod -a -G lpadmin leodyversemilla07

# Start CUPS service
sudo systemctl start cups
sudo systemctl enable cups

# Access CUPS web interface
# Open browser: http://localhost:631

# Add printer via web interface:
# 1. Administration > Add Printer
# 2. Select Brother DCP-T720DW
# 3. Set as default printer

# Or via command line:
sudo lpadmin -p Brother_DCP_T720DW -E -v usb://Brother/DCP-T720DW -m everywhere
sudo lpadmin -d Brother_DCP_T720DW

# Test print
echo "Test print from Piso Print" | lp
```

#### For Other CUPS-Compatible Printers:

```bash
# Install CUPS
sudo apt install -y cups cups-client

# Add user to lpadmin group
sudo usermod -a -G lpadmin leodyversemilla07

# Start CUPS service
sudo systemctl start cups
sudo systemctl enable cups

# Use CUPS web interface (http://localhost:631) to add your printer
# Or use lpadmin command with appropriate driver and URI
```

### 3. Print Job Monitor Service

```bash
# Install systemd service
sudo cp ~/piso-print/piso-print-job-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable piso-print-job-monitor
sudo systemctl start piso-print-job-monitor

# Check status
sudo systemctl status piso-print-job-monitor
```

### 4. WiFi Hotspot Setup (Optional)

**For wireless file uploads:**

```bash
# Install required packages
sudo apt install -y hostapd dnsmasq

# Stop services during configuration
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# Configure hostapd
sudo nano /etc/hostapd/hostapd.conf
```

**hostapd.conf:**

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
```

```bash
# Configure dnsmasq
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
sudo nano /etc/dnsmasq.conf
```

**dnsmasq.conf:**

```conf
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
domain=local
address=/pisoprintkiosk.local/192.168.4.1
```

```bash
# Configure static IP for wlan0
sudo nano /etc/dhcpcd.conf
```

**Add to dhcpcd.conf:**

```conf
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

```bash
# Enable IP forwarding
sudo nano /etc/sysctl.conf
# Uncomment: net.ipv4.ip_forward=1

# Apply changes
sudo sysctl -w net.ipv4.ip_forward=1

# Configure NAT
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"

# Enable services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

# Reboot to apply
sudo reboot
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Illegal instruction" Error During npm build

**Symptom:** Build fails on ARM64 architecture

**Solution:**
```bash
rm -rf node_modules
npm install --force --arch=arm64
npm run build
```

#### 2. Nginx 403 Forbidden Error

**Symptom:** Cannot access application via browser

**Solution:**
```bash
# Fix home directory permissions
chmod +x /home/leodyversemilla07

# Check Nginx error log
sudo tail -f /var/log/piso-print/error.log
```

#### 3. Touch Scrolling Not Working

**Symptom:** Touch taps work but scrolling doesn't

**Solution:**
```bash
# Verify X11 (not Wayland)
echo $XDG_SESSION_TYPE
# Should output "tty" or "x11"

# If Wayland, switch to X11:
sudo raspi-config nonint do_wayland W1
sudo reboot

# Verify touch device detected
DISPLAY=:0 xinput list
# Should show ft5x06 device

# Add touch scrolling CSS (see Touch Scrolling Configuration section)
# Rebuild assets: npm run build
```

#### 4. Chromium Won't Start from SSH

**Symptom:** Chromium command does nothing when run via SSH

**Solution:**
```bash
# Always use DISPLAY=:0 prefix
DISPLAY=:0 chromium-browser --kiosk http://localhost &

# Or use the startup script
DISPLAY=:0 ~/start-kiosk.sh &
```

#### 5. Database Connection Failed

**Symptom:** Laravel shows database connection error

**Solution:**
```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Verify database credentials
mysql -u pisoprint -p piso_print
# If fails, recreate user:
sudo mysql
CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON piso_print.* TO 'pisoprint'@'localhost';
FLUSH PRIVILEGES;
```

#### 6. ESP32 Serial Port Not Found

**Symptom:** Cannot access /dev/ttyUSB0

**Solution:**
```bash
# Add user to dialout group
sudo usermod -a -G dialout leodyversemilla07

# Logout and login (or reboot)
sudo reboot

# Verify device exists
ls -l /dev/ttyUSB*

# Check dmesg for connection
dmesg | grep tty
```

#### 7. Printer Not Detected by CUPS

**Symptom:** Epson M1110 or Brother printer not showing in CUPS

**Solution:**
```bash
# Restart CUPS
sudo systemctl restart cups

# Check USB connection
lsusb | grep -i -E "(epson|brother)"
# For Epson: should show Epson device
# For Brother: should show Brother device

# For network printer, ensure on same network
ping printer-ip-address

# Reinstall drivers if needed
# For Epson:
sudo apt install --reinstall printer-driver-escpr

# For Brother:
sudo apt install --reinstall printer-driver-brlaser

# Check CUPS error logs
sudo tail -f /var/log/cups/error_log
```

#### 8. Emojis Not Rendering (Showing as Boxes)

**Symptom:** Emojis appear as empty boxes or squares on kiosk pages

**Solution:**
```bash
# Install emoji fonts
sudo apt install -y fonts-noto-color-emoji

# Clear font cache
fc-cache -f -v

# Restart Chromium
DISPLAY=:0 killall chromium-browser
DISPLAY=:0 ~/start-kiosk.sh &

# Verify emoji fonts installed
fc-list | grep -i emoji
# Should show: Noto Color Emoji
```

---

## Maintenance

### Daily Operations

**Check Service Status:**
```bash
sudo systemctl status nginx php8.3-fpm mariadb
sudo systemctl status piso-print-esp32
sudo systemctl status piso-print-job-monitor
```

**View Application Logs:**
```bash
# Laravel logs
tail -f ~/piso-print/storage/logs/laravel.log

# Nginx logs
sudo tail -f /var/log/piso-print/access.log
sudo tail -f /var/log/piso-print/error.log

# System logs
sudo journalctl -u piso-print-esp32 -f
sudo journalctl -u piso-print-job-monitor -f
```

### Backup Procedures

**Database Backup:**
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
mysqldump -u pisoprint -p piso_print > ~/backups/piso_print_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (crontab)
crontab -e
# Add line:
0 2 * * * mysqldump -u pisoprint -p'your_password' piso_print > /home/leodyversemilla07/backups/piso_print_$(date +\%Y\%m\%d).sql
```

**Application Files Backup:**
```bash
# Backup uploaded files
tar -czf ~/backups/uploads_$(date +%Y%m%d).tar.gz ~/piso-print/storage/app/public/uploads

# Backup configuration
cp ~/piso-print/.env ~/backups/.env.$(date +%Y%m%d)
```

### Update Procedures

**Update Application Code:**
```bash
cd ~/piso-print

# Pull latest changes
git pull origin main

# Update dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Run migrations
php artisan migrate --force

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Restart services
sudo systemctl restart php8.3-fpm
```

**Update System Packages:**
```bash
sudo apt update
sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

### Log Rotation

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/piso-print
```

**Log rotation config:**
```conf
/var/log/piso-print/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}

/home/leodyversemilla07/piso-print/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 leodyversemilla07 leodyversemilla07
}
```

### Performance Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h
du -sh ~/piso-print/*

# Check memory usage
free -h

# Check database size
sudo mysql -e "SELECT table_schema AS 'Database', 
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
    FROM information_schema.TABLES 
    WHERE table_schema = 'piso_print';"
```

---

## Deployment Checklist

Use this checklist to ensure all steps are completed:

### Pre-Deployment
- [ ] Fix syntax errors in app.blade.php
- [ ] Commit and push all code changes
- [ ] Setup SSH access to Raspberry Pi
- [ ] Setup GitHub SSH key on Raspberry Pi

### System Setup
- [ ] Update system packages
- [ ] Install PHP 8.3 (via Sury repo)
- [ ] Install MariaDB 11.8+
- [ ] Install Nginx web server
- [ ] Install Node.js 20 (via NVM)
- [ ] Install Composer 2.8+

### Application Setup
- [ ] Clone repository
- [ ] Install Composer dependencies
- [ ] Install npm dependencies (with ARM64 fix if needed)
- [ ] Build frontend assets
- [ ] Configure .env file
- [ ] Create database and user
- [ ] Run migrations
- [ ] Configure Nginx site
- [ ] Fix directory permissions
- [ ] Verify web access

### Kiosk Setup
- [ ] Install desktop environment
- [ ] Install emoji fonts (fonts-noto-color-emoji)
- [ ] Switch to X11 (from Wayland)
- [ ] Configure auto-login
- [ ] Create kiosk startup script
- [ ] Configure autostart
- [ ] Verify 7-inch display detected
- [ ] Verify touch device detected
- [ ] Add touch scrolling CSS
- [ ] Rebuild frontend assets
- [ ] Test touch scrolling
- [ ] Verify emojis render correctly

### Hardware Setup (When Available)
- [ ] Setup ESP32 coin acceptor
- [ ] Configure CUPS printer
- [ ] Setup print job monitor service
- [ ] Configure WiFi hotspot (optional)

### Final Verification
- [ ] All services running
- [ ] Web application accessible
- [ ] Touch interface working
- [ ] Kiosk mode starts on boot
- [ ] Database backups configured
- [ ] Log rotation configured

---

## Version Information

Deployment tested and confirmed working with:

- **Raspberry Pi 4:** 8GB RAM, aarch64
- **Raspberry Pi OS:** Debian 13 Trixie 64-bit
- **Kernel:** 6.12.47-v8-16k+
- **PHP:** 8.3.26
- **MariaDB:** 11.8.3-MariaDB
- **Nginx:** 1.26.0
- **Node.js:** 20.19.5
- **Composer:** 2.8.12
- **Chromium:** 141.0.7390.122
- **Laravel:** 12.36.0
- **Display:** 7-inch DSI touchscreen (800×480)
- **Touch Controller:** ft5x06 capacitive touchscreen

---

## Additional Resources

- **Main Deployment Guide:** See `DEPLOYMENT.md` for general deployment information
- **ESP32 Firmware:** See `esp32-firmware/README.md` for coin acceptor setup
- **ESP32 Wiring:** See `esp32-firmware/WIRING.md` for hardware connections
- **Testing Guide:** See `esp32-firmware/TESTING.md` for hardware testing
- **System Documentation:** See `docs/` folder for detailed system information

---

## Support

If you encounter issues not covered in this guide:

1. Check Laravel logs: `~/piso-print/storage/logs/laravel.log`
2. Check Nginx logs: `/var/log/piso-print/error.log`
3. Check system logs: `sudo journalctl -xe`
4. Review this deployment guide's Troubleshooting section

---

**Document Version:** 1.0  
**Last Updated:** November 2, 2025  
**Deployment Date:** November 2, 2025  
**Deployed By:** Leodyver Semilla

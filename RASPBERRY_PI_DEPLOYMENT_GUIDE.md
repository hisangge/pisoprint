# 🍓 Piso Print - Raspberry Pi Deployment Guide

**Complete Step-by-Step Guide for Deploying Piso Print on Raspberry Pi**

> ⚠️ **IMPORTANT**: Follow each step in order. Complete one step fully before moving to the next. Verify each installation before proceeding.

---

## Table of Contents

1. [Prerequisites & Hardware Requirements](#1-prerequisites--hardware-requirements)
2. [Step 1: Flash Raspberry Pi OS](#step-1-flash-raspberry-pi-os)
3. [Step 2: First Boot & System Update](#step-2-first-boot--system-update)
4. [Step 3: Install Git](#step-3-install-git)
5. [Step 4: Install PHP 8.3](#step-4-install-php-83)
6. [Step 5: Install Composer](#step-5-install-composer)
7. [Step 6: Install Node.js 22.x](#step-6-install-nodejs-22x)
8. [Step 7: Install Nginx Web Server](#step-7-install-nginx-web-server)
9. [Step 8: Install MySQL/MariaDB Database](#step-8-install-mysqlmariadb-database)
10. [Step 9: Install CUPS Printing System](#step-9-install-cups-printing-system)
11. [Step 10: Install Printer Drivers](#step-10-install-printer-drivers)
12. [Step 11: Clone & Setup Application](#step-11-clone--setup-application)
13. [Step 12: Configure Nginx for Laravel](#step-12-configure-nginx-for-laravel)
14. [Step 13: Setup USB Auto-Detection](#step-13-setup-usb-auto-detection)
15. [Step 14: Install WiFi Hotspot (hostapd)](#step-14-install-wifi-hotspot-hostapd)
16. [Step 15: Configure DNS (dnsmasq)](#step-15-configure-dns-dnsmasq)
17. [Step 16: Setup mDNS (Avahi)](#step-16-setup-mdns-avahi)
18. [Step 17: Setup ESP32 Coin Acceptor](#step-17-setup-esp32-coin-acceptor)
19. [Step 18: Configure Systemd Services](#step-18-configure-systemd-services)
20. [Step 19: Setup Kiosk Mode](#step-19-setup-kiosk-mode)
21. [Step 20: Final Testing & Verification](#step-20-final-testing--verification)
22. [Troubleshooting](#troubleshooting)
23. [Maintenance & Updates](#maintenance--updates)
24. [Quick Reference](#quick-reference)

---

## 1. Prerequisites & Hardware Requirements

### Hardware Checklist

| Component         | Specification                                       | ✓   |
| ----------------- | --------------------------------------------------- | --- |
| **Raspberry Pi**  | Raspberry Pi 4/5 (4GB/8GB RAM recommended)          | ☐   |
| **Storage**       | 32GB+ Class 10 microSD card                         | ☐   |
| **Display**       | LAFVIN 7" Touchscreen IPS DSI Display (800×480)     | ☐   |
| **ESP32**         | ESP32 Development Board (CH340C, USB-C, 30-Pin)     | ☐   |
| **Coin Acceptor** | ALLAN Universal Coinslot 1239 PROMAX Multi-Coin     | ☐   |
| **Printer**       | Brother DCP-T720DW (or any CUPS-compatible printer) | ☐   |
| **Power**         | 5V 3A USB-C for Pi, 12V 2A for Coin Acceptor        | ☐   |
| **Dev Machine**   | Windows/Mac/Linux PC for building frontend assets   | ☐   |

### Software to be Installed (in order)

| #   | Software        | Purpose                   |
| --- | --------------- | ------------------------- |
| 1   | Raspberry Pi OS | Operating System (64-bit) |
| 2   | Git             | Version control           |
| 3   | PHP 8.3         | Laravel backend           |
| 4   | Composer        | PHP package manager       |
| 5   | Node.js 22.x    | Frontend build tools      |
| 6   | Nginx           | Web server                |
| 7   | MariaDB         | Database                  |
| 8   | CUPS            | Printing system           |
| 9   | Brother Driver  | Printer driver            |
| 10  | hostapd         | WiFi hotspot              |
| 11  | dnsmasq         | DNS/DHCP server           |
| 12  | Avahi           | mDNS (local domain)       |
| 13  | Emoji Fonts     | Color emoji rendering     |

---

## Step 1: Flash Raspberry Pi OS

### 1.1 Download Raspberry Pi Imager

Download from: https://www.raspberrypi.com/software/

### 1.2 Configure and Flash

1. Insert microSD card into your computer
2. Open Raspberry Pi Imager
3. Click **"Choose OS"** → Select **"Raspberry Pi OS (64-bit)"** - Debian Bookworm
4. Click **"Choose Storage"** → Select your microSD card
5. Click the **gear icon (⚙️)** to configure:

    | Setting       | Value                                 |
    | ------------- | ------------------------------------- |
    | Hostname      | `pisoprint`                           |
    | Enable SSH    | ✓ (with password)                     |
    | Username      | `pisoprint`                           |
    | Password      | `pisoprint`                           |
    | WiFi SSID     | Your WiFi network (for initial setup) |
    | WiFi Password | Your WiFi password                    |
    | Locale        | `Asia/Manila`                         |

6. Click **"Write"** and wait for completion

### 1.3 Verify

- [ ] microSD card flashed successfully
- [ ] No errors during write process

**✅ Step 1 Complete** - Insert microSD into Raspberry Pi and power on.

---

## Step 2: First Boot & System Update

### 2.1 Wait for First Boot

Wait 2-3 minutes for Raspberry Pi to fully boot.

### 2.2 Connect via SSH

```bash
ssh pisoprint@pisoprint.local
```

Or use the IP address:

```bash
ssh pisoprint@<IP_ADDRESS>
```

Password: `pisoprint`

### 2.3 Update System Packages

```bash
sudo apt update
```

**Verify**: You should see package lists being downloaded.

```bash
sudo apt upgrade -y
```

**Verify**: System packages are upgraded.

### 2.4 Configure Raspberry Pi Settings

```bash
sudo raspi-config
```

Navigate and configure:

1. **System Options** → **Boot / Auto Login** → **Desktop Autologin**
2. **Interface Options** → **Serial Port** → Login shell: **No**, Hardware: **Yes**
3. **Localisation Options** → **Timezone** → Asia → Manila
4. **Finish** and **Reboot**

### 2.5 Verify Step 2

```bash
# Check system is updated
cat /etc/os-release
```

Expected output should show: `Debian GNU/Linux 12 (bookworm)`

- [ ] SSH connection successful
- [ ] System updated
- [ ] Raspi-config completed

**✅ Step 2 Complete**

---

## Step 3: Install Git

### 3.1 Install Git

```bash
sudo apt install -y git
```

### 3.2 Verify Installation

```bash
git --version
```

**Expected output**: `git version 2.x.x`

- [ ] Git installed successfully

**✅ Step 3 Complete**

---

## Step 4: Install PHP 8.3

### 4.1 Install Prerequisites

```bash
sudo apt install -y lsb-release apt-transport-https ca-certificates wget
```

### 4.2 Add PHP Repository

```bash
wget -qO - https://packages.sury.org/php/apt.gpg | sudo tee /usr/share/keyrings/deb.sury.org-php.gpg > /dev/null
```

```bash
echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/php.list
```

### 4.3 Update Package List

```bash
sudo apt update
```

### 4.4 Install PHP 8.3 and Extensions

```bash
sudo apt install -y php8.3-cli php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-bcmath php8.3-readline php8.3-sqlite3
```

### 4.5 Verify Installation

```bash
php -v
```

**Expected output**: `PHP 8.3.x`

```bash
php -m | grep -E 'mysql|mbstring|xml|curl|zip|gd'
```

**Expected output**: List of installed extensions

### 4.6 Check PHP-FPM Service

```bash
sudo systemctl status php8.3-fpm
```

**Expected**: Active (running)

- [ ] PHP 8.3 installed
- [ ] All extensions installed
- [ ] PHP-FPM running

**✅ Step 4 Complete**

---

## Step 5: Install Composer

### 5.1 Download Composer Installer

```bash
curl -sS https://getcomposer.org/installer -o composer-setup.php
```

### 5.2 Install Composer Globally

```bash
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
```

### 5.3 Remove Installer

```bash
rm composer-setup.php
```

### 5.4 Verify Installation

```bash
composer --version
```

**Expected output**: `Composer version 2.x.x`

- [ ] Composer installed globally

**✅ Step 5 Complete**

---

## Step 6: Install Node.js 22.x

### 6.1 Add NodeSource Repository

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

### 6.2 Install Node.js

```bash
sudo apt install -y nodejs
```

### 6.3 Verify Installation

```bash
node -v
```

**Expected output**: `v22.x.x`

```bash
npm -v
```

**Expected output**: `10.x.x`

- [ ] Node.js 22.x installed
- [ ] npm installed

**✅ Step 6 Complete**

---

## Step 7: Install Nginx Web Server

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Start and Enable Nginx

```bash
sudo systemctl start nginx
```

```bash
sudo systemctl enable nginx
```

### 7.3 Verify Installation

```bash
sudo systemctl status nginx
```

**Expected**: Active (running)

```bash
curl -I http://localhost
```

**Expected**: `HTTP/1.1 200 OK`

### 7.4 Test from Browser

Open in browser: `http://<raspberry_pi_ip>`

You should see the **"Welcome to nginx!"** page.

- [ ] Nginx installed
- [ ] Nginx running
- [ ] Web page accessible

**✅ Step 7 Complete**

---

## Step 8: Install MySQL/MariaDB Database

### 8.1 Install MariaDB Server

```bash
sudo apt install -y mariadb-server mariadb-client
```

### 8.2 Start and Enable MariaDB

```bash
sudo systemctl start mariadb
```

```bash
sudo systemctl enable mariadb
```

### 8.3 Secure Installation

> **Note**: On Debian Bookworm and MariaDB 10.5+, the command is `mariadb-secure-installation`. The old `mysql_secure_installation` command may not exist.

```bash
sudo mariadb-secure-installation
```

**Follow the prompts:**

| Prompt                               | Answer              |
| ------------------------------------ | ------------------- |
| Enter current password for root      | Press Enter (blank) |
| Switch to unix_socket authentication | n                   |
| Change the root password             | Y                   |
| New password                         | `pisoprint`         |
| Remove anonymous users               | Y                   |
| Disallow root login remotely         | Y                   |
| Remove test database                 | Y                   |
| Reload privilege tables              | Y                   |

> **Alternative**: From MariaDB 10.4+, Unix socket authentication is used by default, so you can skip this step and proceed directly to creating the database and user. The root user will authenticate via the socket (sudo) without a password.

### 8.4 Create Database and User

```bash
sudo mysql -u root -p
```

Enter password: `pisoprint`

Run these SQL commands:

```sql
CREATE DATABASE pisoprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```sql
CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'pisoprint';
```

```sql
GRANT ALL PRIVILEGES ON pisoprint.* TO 'pisoprint'@'localhost';
```

```sql
FLUSH PRIVILEGES;
```

```sql
EXIT;
```

### 8.5 Verify Database

```bash
mysql -u pisoprint -ppisoprint -e "SHOW DATABASES;"
```

**Expected**: You should see `pisoprint` in the list.

- [ ] MariaDB installed
- [ ] MariaDB running
- [ ] Database `pisoprint` created
- [ ] User `pisoprint` created

**✅ Step 8 Complete**

---

## Step 9: Install CUPS Printing System

> **Note**: CUPS is often pre-installed on Raspberry Pi OS Desktop. Check if it's already running before installing.

### 9.1 Check if CUPS is Already Installed

```bash
sudo systemctl status cups
```

If you see `Active: active (running)`, CUPS is already installed. Skip to **Step 9.4**.

### 9.2 Install CUPS (if not pre-installed)

```bash
sudo apt install -y cups
```

### 9.3 Install Additional CUPS Packages

```bash
sudo apt install -y cups-bsd cups-client
```

### 9.3 Start and Enable CUPS

```bash
sudo systemctl start cups
```

```bash
sudo systemctl enable cups
```

### 9.4 Add User to Printer Admin Group

```bash
sudo usermod -a -G lpadmin pisoprint
```

```bash
sudo usermod -a -G lpadmin www-data
```

### 9.5 Configure CUPS for Remote Access

```bash
sudo cupsctl --remote-admin --remote-any --share-printers
```

### 9.6 Restart CUPS

```bash
sudo systemctl restart cups
```

### 9.7 Verify Installation

```bash
sudo systemctl status cups
```

**Expected**: Active (running)

```bash
lpstat -v
```

**Expected**: Lists available printers (may be empty if no printer connected yet)

### 9.8 Access CUPS Web Interface

Open in browser: `http://<raspberry_pi_ip>:631`

You should see the **CUPS Administration** page.

- [ ] CUPS installed
- [ ] CUPS running
- [ ] User added to lpadmin group
- [ ] CUPS web interface accessible

**✅ Step 9 Complete**

---

## Step 10: Install Printer Drivers

> **Note**: Many printers, including Brother DCP-T720DW, are supported out-of-the-box by CUPS on Raspberry Pi OS. Try adding your printer first via the CUPS web interface before manually installing drivers.

### 10.1 Connect Printer via USB

1. Connect your Brother printer to Raspberry Pi via USB cable
2. Power on the printer

### 10.2 Check if Printer is Detected

```bash
lsusb | grep -i brother
```

**Expected**: You should see your Brother printer listed.

```bash
lpinfo -v | grep usb
```

**Expected**: Shows USB printer device path.

### 10.3 Add Printer via CUPS Web Interface

1. Open browser: `http://<raspberry_pi_ip>:631`
2. Go to **Administration** tab
3. Click **Add Printer**
4. Login with: `pisoprint` / `pisoprint`
5. Select your USB printer: **"Brother DCP-T720DW"**
6. Click **Continue**
7. Set Name: `Brother_DCP_T720DW_USB`
8. Check **"Share This Printer"**
9. Click **Continue**
10. Select the appropriate driver (CUPS usually auto-detects)
11. Click **Add Printer**
12. Set default options and click **Set Default Options**

### 10.4 Set as Default Printer

```bash
sudo lpadmin -d Brother_DCP_T720DW_USB
```

### 10.5 Verify Printer

```bash
lpstat -p -d
```

**Expected**: Shows printer status and default printer

### 10.6 Test Print

```bash
echo "Test Print from Piso Print Kiosk" | lp -d Brother_DCP_T720DW_USB
```

**Expected**: Printer prints the test message

### 10.7 Manual Driver Installation (Only if needed)

> Skip this section if the printer works without manual driver installation.

If CUPS doesn't detect your printer or you experience issues, install the Brother drivers manually:

```bash
cd /tmp
```

```bash
wget https://download.brother.com/welcome/dlf105450/brcupsconfig5.tar.gz
```

```bash
wget https://download.brother.com/welcome/dlf101775/dcpt720dwpdrv-2.0.1-1.armhf.deb
```

```bash
sudo dpkg -i dcpt720dwpdrv-2.0.1-1.armhf.deb
```

```bash
sudo apt --fix-broken install -y
```

```bash
tar -xvzf brcupsconfig5.tar.gz
```

```bash
sudo ./brcupsconfig5/brcupsconfig5
```

After installing drivers, repeat Steps 10.3-10.6.

- [ ] Printer connected
- [ ] Printer detected by CUPS
- [ ] Printer added to CUPS
- [ ] Test print successful

**✅ Step 10 Complete**

---

## Step 11: Clone & Setup Application

### 11.1 Create Web Directory

```bash
sudo mkdir -p /var/www/pisoprint
```

```bash
sudo chown -R pisoprint:www-data /var/www/pisoprint
```

### 11.2 Clone Repository

```bash
cd /var/www
```

```bash
git clone https://github.com/hisangge/pisoprint.git pisoprint
```

```bash
cd pisoprint
```

### 11.3 Install PHP Dependencies

```bash
composer install --no-dev --optimize-autoloader
```

**Wait for completion** - This may take several minutes.

### 11.4 Install Node.js Dependencies

```bash
npm ci
```

**Wait for completion** - This may take several minutes.

### 11.5 Build Frontend Assets

> ⚠️ **CRITICAL**: Due to ARM architecture incompatibility with native binaries (esbuild/rollup), you **cannot build on the Raspberry Pi**. You must build on a development machine and transfer the files.

#### Option A: Build on Development Machine (Recommended)

On your Windows/Mac/Linux development machine:

```bash
# Clone and build locally
git clone https://github.com/hisangge/pisoprint.git
cd pisoprint
npm ci
npm run build

# Transfer build files to Pi via SCP
scp -r public/build pisoprint@<PI_IP>:/var/www/pisoprint/public/
```

#### Option B: If you try `npm run build` on Pi

You will see "Illegal instruction" errors. This is expected - use Option A instead.

#### Verify Build Transfer

```bash
ls -la /var/www/pisoprint/public/build/
```

**Expected**: Should contain `manifest.json` and `assets/` folder

### 11.6 Create Environment File

```bash
cp .env.example .env
```

### 11.7 Generate Application Key

```bash
php artisan key:generate
```

### 11.8 Configure Environment

```bash
nano .env
```

Update these values:

```env
APP_NAME=PisoPrint
APP_ENV=production
APP_DEBUG=false
APP_URL=http://pisoprinting.connect

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pisoprint
DB_USERNAME=pisoprint
DB_PASSWORD=pisoprint

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

ESP32_MOCK_ENABLED=false
PRINTER_MOCK_ENABLED=false

PRINTER_NAME=Brother_DCP_T720DW_USB
PRINTING_DRIVER=cups
PRINTING_DEFAULT_PRINTER_ID=Brother_DCP_T720DW_USB

USB_MOUNT_POINT=/mnt/usb
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 11.9 Run Database Migrations

```bash
php artisan migrate --force
```

### 11.10 Create Storage Link

```bash
php artisan storage:link
```

### 11.11 Optimize Application

```bash
php artisan config:cache
```

```bash
php artisan route:cache
```

```bash
php artisan view:cache
```

```bash
php artisan optimize
```

### 11.12 Set Permissions

```bash
sudo chown -R pisoprint:www-data /var/www/pisoprint
```

```bash
sudo chmod -R 755 /var/www/pisoprint
```

```bash
sudo chmod -R 775 /var/www/pisoprint/storage
```

```bash
sudo chmod -R 775 /var/www/pisoprint/bootstrap/cache
```

```bash
sudo chown -R www-data:www-data /var/www/pisoprint/public/build
```

```bash
sudo chmod -R 755 /var/www/pisoprint/public/build
```

### 11.13 Grant Serial Port Access

```bash
sudo usermod -a -G dialout www-data
```

```bash
sudo usermod -a -G dialout pisoprint
```

### 11.14 Verify Application Files

```bash
ls -la /var/www/pisoprint/
```

**Expected**: Shows application files including `artisan`, `composer.json`, `public/`, etc.

```bash
ls -la /var/www/pisoprint/public/build/
```

**Expected**: Shows `manifest.json` and `assets/` directory (from build transfer)

- [ ] Repository cloned
- [ ] Composer dependencies installed
- [ ] Node dependencies installed
- [ ] Frontend built
- [ ] Environment configured
- [ ] Database migrated
- [ ] Permissions set

**✅ Step 11 Complete**

---

## Step 12: Configure Nginx for Laravel

### 12.1 Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/piso-print
```

Paste the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pisoprinting.connect 192.168.4.1 localhost;

    root /var/www/pisoprint/public;
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

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 12.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/piso-print /etc/nginx/sites-enabled/
```

### 12.3 Remove Default Site

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 12.4 Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected**: `syntax is ok` and `test is successful`

### 12.5 Restart Nginx

```bash
sudo systemctl restart nginx
```

### 12.6 Configure PHP-FPM (Optional Performance Tuning)

```bash
sudo nano /etc/php/8.3/fpm/pool.d/www.conf
```

Find and update these values:

```ini
pm = dynamic
pm.max_children = 10
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
pm.max_requests = 500
```

Save and exit.

### 12.7 Restart PHP-FPM

```bash
sudo systemctl restart php8.3-fpm
```

### 12.8 Configure PHP Upload Limits

Create a custom PHP configuration for larger file uploads:

```bash
sudo nano /etc/php/8.3/fpm/conf.d/99-pisoprint.ini
```

Paste:

```ini
; PisoPrint custom settings
upload_max_filesize = 50M
post_max_size = 55M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
```

Save and exit.

```bash
sudo systemctl restart php8.3-fpm
```

### 12.9 Verify Application

```bash
curl -I http://localhost
```

**Expected**: `HTTP/1.1 200 OK`

Open in browser: `http://<raspberry_pi_ip>`

You should see the **Piso Print** application.

- [ ] Nginx configured
- [ ] Site enabled
- [ ] Configuration test passed
- [ ] Application accessible in browser

**✅ Step 12 Complete**

---

## Step 13: Setup USB Auto-Detection

### 13.1 Create USB Mount Directory

```bash
sudo mkdir -p /mnt/usb
```

```bash
sudo chown pisoprint:www-data /mnt/usb
```

```bash
sudo chmod 775 /mnt/usb
```

### 13.2 Install USB Support Packages

```bash
sudo apt install -y udisks2 ntfs-3g exfat-fuse exfatprogs
```

> **Note**: On older systems, use `exfat-utils` instead of `exfatprogs`.

### 13.3 Create USB Manager Script

```bash
sudo nano /usr/local/bin/usb-manager.sh
```

Paste the following:

```bash
#!/bin/bash

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
    sleep 2
    mkdir -p "$MOUNT_POINT"
    FSTYPE=$(blkid -o value -s TYPE "$DEVICE_PATH" 2>/dev/null)

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
        *)
            mount "$DEVICE_PATH" "$MOUNT_POINT"
            ;;
    esac

    if [ $? -eq 0 ]; then
        log "SUCCESS: Mounted $DEVICE_NAME ($FSTYPE) to $MOUNT_POINT"
        curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
             -d "{\"device\":\"$DEVICE_NAME\", \"status\":\"mounted\", \"mount_point\":\"$MOUNT_POINT\"}" \
             --max-time 5 > /dev/null 2>&1 &
    else
        log "ERROR: Failed to mount $DEVICE_NAME"
        rmdir "$MOUNT_POINT" 2>/dev/null
    fi

elif [ "$ACTION" == "remove" ]; then
    umount -l "$MOUNT_POINT" 2>/dev/null
    rmdir "$MOUNT_POINT" 2>/dev/null
    log "SUCCESS: Unmounted $DEVICE_NAME"
    curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
         -d "{\"device\":\"$DEVICE_NAME\", \"status\":\"removed\"}" \
         --max-time 5 > /dev/null 2>&1 &
fi
```

Save and exit.

### 13.4 Make Script Executable

```bash
sudo chmod +x /usr/local/bin/usb-manager.sh
```

### 13.5 Create Log File

```bash
sudo touch /var/log/usb-manager.log
```

```bash
sudo chown pisoprint:www-data /var/log/usb-manager.log
```

```bash
sudo chmod 664 /var/log/usb-manager.log
```

### 13.6 Create Udev Rules

```bash
sudo nano /etc/udev/rules.d/99-usb-automount.rules
```

Paste:

```udev
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_TYPE}!="", ENV{ID_BUS}=="usb", RUN+="/usr/local/bin/usb-manager.sh add %k"
ACTION=="remove", SUBSYSTEM=="block", ENV{ID_BUS}=="usb", RUN+="/usr/local/bin/usb-manager.sh remove %k"
```

Save and exit.

### 13.7 Reload Udev Rules

```bash
sudo udevadm control --reload-rules
```

```bash
sudo udevadm trigger
```

### 13.8 Test USB Detection

1. Insert a USB flash drive
2. Check if mounted:

```bash
lsblk
```

```bash
ls -la /mnt/usb/
```

```bash
tail /var/log/usb-manager.log
```

- [ ] USB mount directory created
- [ ] USB manager script created
- [ ] Udev rules configured
- [ ] USB detection working

**✅ Step 13 Complete**

---

## Step 14: Install WiFi Hotspot (hostapd)

### 14.1 Install hostapd

```bash
sudo apt install -y hostapd
```

### 14.2 Stop hostapd (for configuration)

```bash
sudo systemctl stop hostapd
```

### 14.3 Configure Static IP for wlan0

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end of the file:

```conf
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

Save and exit.

### 14.4 Create hostapd Configuration

```bash
sudo nano /etc/hostapd/hostapd.conf
```

Paste:

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

Save and exit.

### 14.5 Point hostapd to Configuration

```bash
sudo nano /etc/default/hostapd
```

Find and update:

```conf
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

Save and exit.

### 14.6 Unmask and Enable hostapd

```bash
sudo systemctl unmask hostapd
```

```bash
sudo systemctl enable hostapd
```

### 14.7 Verify (Don't Start Yet)

We'll start hostapd after configuring dnsmasq in the next step.

- [ ] hostapd installed
- [ ] Static IP configured
- [ ] hostapd configuration created
- [ ] hostapd enabled

**✅ Step 14 Complete**

---

## Step 15: Configure DNS (dnsmasq)

### 15.1 Install dnsmasq

```bash
sudo apt install -y dnsmasq
```

### 15.2 Stop dnsmasq (for configuration)

```bash
sudo systemctl stop dnsmasq
```

### 15.3 Backup Original Configuration

```bash
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
```

### 15.4 Create New Configuration

```bash
sudo nano /etc/dnsmasq.conf
```

Paste:

```conf
interface=wlan0
dhcp-range=192.168.4.100,192.168.4.200,255.255.255.0,24h
domain=wlan
address=/pisoprinting.connect/192.168.4.1
server=8.8.8.8
server=8.8.4.4
```

Save and exit.

### 15.5 Enable dnsmasq

```bash
sudo systemctl enable dnsmasq
```

### 15.6 Unblock WiFi (if blocked)

```bash
sudo rfkill unblock wifi
```

### 15.7 Restart Services

```bash
sudo systemctl restart dhcpcd
```

```bash
sudo systemctl start hostapd
```

```bash
sudo systemctl start dnsmasq
```

### 15.8 Verify WiFi Hotspot

```bash
sudo systemctl status hostapd
```

**Expected**: Active (running)

```bash
sudo systemctl status dnsmasq
```

**Expected**: Active (running)

### 15.9 Test WiFi Connection

From your phone or laptop:

1. Scan for WiFi networks
2. Connect to **"PisoPrint_Kiosk"**
3. Enter password: **PisoPrint2025**
4. Open browser: `http://192.168.4.1`

- [ ] dnsmasq installed
- [ ] dnsmasq configured
- [ ] hostapd running
- [ ] dnsmasq running
- [ ] Can connect to WiFi hotspot
- [ ] Can access web app via hotspot

**✅ Step 15 Complete**

---

## Step 16: Setup mDNS (Avahi)

### 16.1 Install Avahi

```bash
sudo apt install -y avahi-daemon avahi-utils
```

### 16.2 Start and Enable Avahi

```bash
sudo systemctl start avahi-daemon
```

```bash
sudo systemctl enable avahi-daemon
```

### 16.3 Create Custom Service File

```bash
sudo nano /etc/avahi/services/pisoprint.service
```

Paste:

```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name>Piso Print Kiosk</name>
  <service>
    <type>_http._tcp</type>
    <port>80</port>
    <txt-record>path=/</txt-record>
  </service>
</service-group>
```

Save and exit.

### 16.4 Restart Avahi

```bash
sudo systemctl restart avahi-daemon
```

### 16.5 Verify mDNS

```bash
avahi-browse -a -t
```

**Expected**: Shows Piso Print Kiosk service

### 16.6 Test Domain Access

From a connected device, open browser:

- `http://pisoprinting.connect`

- [ ] Avahi installed
- [ ] Avahi running
- [ ] mDNS service configured
- [ ] Domain accessible

**✅ Step 16 Complete**

---

## Step 17: Setup ESP32 Coin Acceptor

### 17.1 Install Python Dependencies

```bash
sudo apt install -y python3 python3-pip python3-serial python3-requests
```

### 17.2 Install pip Packages

```bash
cd /var/www/pisoprint/scripts
```

```bash
pip3 install -r requirements.txt --break-system-packages
```

### 17.3 Configure Serial Port

Ensure UART is enabled (done in Step 2 via raspi-config).

### 17.4 Set Serial Port Permissions

```bash
sudo chmod 666 /dev/ttyUSB0
```

(Note: The device may be `/dev/ttyUSB0` or `/dev/ttyACM0` depending on your ESP32)

### 17.5 Wire ESP32 to Raspberry Pi

| ESP32 Pin    | Raspberry Pi Pin          |
| ------------ | ------------------------- |
| GPIO 17 (TX) | GPIO 15 (RXD0) - Pin 10   |
| GPIO 16 (RX) | GPIO 14 (TXD0) - Pin 8    |
| GND          | GND - Pin 6               |
| 5V           | External 5V (not from Pi) |

### 17.6 Wire Coin Acceptor to ESP32

| Coin Acceptor | ESP32              |
| ------------- | ------------------ |
| +12V (Red)    | External 12V Power |
| GND (Black)   | GND (shared)       |
| COIN (White)  | GPIO 25            |

### 17.7 Flash ESP32 Firmware

On your development computer:

1. Open PlatformIO or Arduino IDE
2. Open `/esp32-firmware/piso-print-coin-acceptor/` project
3. Upload firmware to ESP32

### 17.8 Test Coin Listener

```bash
python3 /var/www/pisoprint/scripts/coin_listener.py --port /dev/ttyUSB0
```

Insert a coin and verify it's detected.

Press `Ctrl+C` to stop.

- [ ] Python dependencies installed
- [ ] ESP32 wired to Pi
- [ ] Coin acceptor wired to ESP32
- [ ] ESP32 firmware flashed
- [ ] Coin detection working

**✅ Step 17 Complete**

---

## Step 18: Configure Systemd Services

### 18.1 Create Laravel Queue Worker Service

```bash
sudo nano /etc/systemd/system/laravel-queue.service
```

Paste:

```ini
[Unit]
Description=Laravel Queue Worker for Piso Print
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/pisoprint
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save and exit.

### 18.2 Create Coin Listener Service

```bash
sudo nano /etc/systemd/system/coin-listener.service
```

Paste:

```ini
[Unit]
Description=Piso Print ESP32 Coin Listener
After=network.target

[Service]
Type=simple
User=pisoprint
WorkingDirectory=/var/www/pisoprint/scripts
Environment=ESP32_SERIAL_PORT=/dev/ttyUSB0
Environment=LARAVEL_URL=http://localhost
ExecStart=/usr/bin/python3 coin_listener.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and exit.

### 18.3 Reload Systemd

```bash
sudo systemctl daemon-reload
```

### 18.4 Enable All Services

```bash
sudo systemctl enable nginx
```

```bash
sudo systemctl enable php8.3-fpm
```

```bash
sudo systemctl enable mariadb
```

```bash
sudo systemctl enable cups
```

```bash
sudo systemctl enable laravel-queue
```

```bash
sudo systemctl enable coin-listener
```

```bash
sudo systemctl enable hostapd
```

```bash
sudo systemctl enable dnsmasq
```

```bash
sudo systemctl enable avahi-daemon
```

### 18.5 Start Services

```bash
sudo systemctl start laravel-queue
```

```bash
sudo systemctl start coin-listener
```

### 18.6 Verify All Services

```bash
sudo systemctl status nginx
```

```bash
sudo systemctl status php8.3-fpm
```

```bash
sudo systemctl status mariadb
```

```bash
sudo systemctl status cups
```

```bash
sudo systemctl status laravel-queue
```

```bash
sudo systemctl status coin-listener
```

```bash
sudo systemctl status hostapd
```

```bash
sudo systemctl status dnsmasq
```

**All services should show**: Active (running)

- [ ] Queue worker service created
- [ ] Coin listener service created
- [ ] All services enabled
- [ ] All services running

**✅ Step 18 Complete**

---

## Step 19: Setup Kiosk Mode

### 19.1 Install Kiosk Dependencies

```bash
sudo apt install -y chromium-browser unclutter xdotool onboard fonts-noto-color-emoji
```

> **Note**: `fonts-noto-color-emoji` is required for emoji rendering in Chromium.

### 19.2 Refresh Font Cache

```bash
sudo fc-cache -fv
```

### 19.3 Switch from Wayland to X11 (Important for Touch Scrolling)

> ⚠️ **CRITICAL**: Raspberry Pi OS Bookworm uses Wayland (labwc) by default, which has poor touch scrolling support in Chromium. Switch to X11 for proper touchscreen functionality.

Check current session type:

```bash
grep -E 'session=|greeter=' /etc/lightdm/lightdm.conf | grep -v '^#'
```

If you see `rpd-labwc` (Wayland), switch to X11:

```bash
sudo sed -i 's/autologin-session=rpd-labwc/autologin-session=rpd-x/' /etc/lightdm/lightdm.conf
sudo sed -i 's/user-session=rpd-labwc/user-session=rpd-x/' /etc/lightdm/lightdm.conf
sudo sed -i 's/greeter-session=pi-greeter-labwc/greeter-session=pi-greeter/' /etc/lightdm/lightdm.conf
```

Verify the change:

```bash
grep -E 'session=|greeter=' /etc/lightdm/lightdm.conf | grep -v '^#'
```

**Expected output**:

```
greeter-session=pi-greeter
user-session=rpd-x
autologin-session=rpd-x
```

### 19.4 Create Kiosk Script with Touch Scrolling

```bash
cat > /home/pisoprint/start-kiosk.sh << 'EOF'
#!/bin/bash

# Configuration
KIOSK_URL="http://localhost"
export DISPLAY=:0

# 1. CLEANUP: Kill any previous instances to prevent duplicates
pkill -o chromium || true
pkill -o unclutter || true

# 2. DISPLAY: Disable Screen Sleep & Energy Saving
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

# 3. UTILITIES: Start Background Tools
# Hide the mouse cursor after 0.5 seconds of inactivity
unclutter -idle 0.5 -root &

# 4. RECOVERY: Clean Chromium Crash State
rm -rf ~/.config/chromium/Singleton* 2>/dev/null || true
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null || true

# 5. NETWORK: Wait for Laravel/Nginx
until curl -s -o /dev/null "$KIOSK_URL"; do
  sleep 2
done

# 6. LAUNCH: Start Chromium with TOUCH SCROLLING enabled
chromium \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --check-for-update-interval=31536000 \
    --window-size=800,480 \
    --window-position=0,0 \
    --start-fullscreen \
    --touch-events=enabled \
    --enable-features=TouchpadAndWheelScrollLatching,AsyncTouchEvents,OverlayScrollbar \
    --enable-smooth-scrolling \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --disk-cache-dir=/tmp/chromium-cache \
    --disk-cache-size=52428800 \
    --user-data-dir=/home/pisoprint/.config/chromium \
    "$KIOSK_URL" &

# Keep the script running to monitor the browser process
wait $!
EOF
```

```bash
chmod +x /home/pisoprint/start-kiosk.sh
```

```bash
chown pisoprint:pisoprint /home/pisoprint/start-kiosk.sh
```

### 19.5 Create Autostart Directory

```bash
mkdir -p /home/pisoprint/.config/autostart
```

### 19.6 Create Autostart Entry

```bash
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

### 19.7 Disable Screen Blanking

```bash
sudo mkdir -p /etc/lightdm/lightdm.conf.d
```

```bash
sudo nano /etc/lightdm/lightdm.conf.d/50-no-screensaver.conf
```

Paste:

```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

Save and exit.

### 19.8 Create Exit Kiosk Script

```bash
cat > /home/pisoprint/exit-kiosk.sh << 'EOF'
#!/bin/bash
pkill -f chromium
pkill -f start-kiosk
pkill -f unclutter
echo "Kiosk mode exited. Access desktop now."
EOF
```

```bash
chmod +x /home/pisoprint/exit-kiosk.sh
```

### 19.9 Verify Kiosk Setup

```bash
ls -la /home/pisoprint/*.sh
```

```bash
ls -la /home/pisoprint/.config/autostart/
```

- [ ] Kiosk dependencies installed (including emoji fonts)
- [ ] Switched from Wayland to X11
- [ ] Kiosk script created with touch scrolling flags
- [ ] Autostart configured
- [ ] Screen blanking disabled
- [ ] Exit script created

**✅ Step 19 Complete**

---

## Step 20: Final Testing & Verification

### 20.1 Reboot System

```bash
sudo reboot
```

### 20.2 Wait for Kiosk to Start

After reboot, the kiosk mode should automatically launch Chromium in fullscreen.

### 20.3 Test Checklist

#### Web Application

- [ ] Kiosk opens automatically
- [ ] Application loads correctly
- [ ] No error messages

#### WiFi Hotspot

- [ ] "PisoPrint_Kiosk" network visible
- [ ] Can connect with password "PisoPrint2025"
- [ ] Can access http://192.168.4.1
- [ ] Can access http://pisoprinting.connect

#### Printer

```bash
lpstat -p -d
```

- [ ] Printer shows as ready
- [ ] Test print works:

```bash
echo "Final Test" | lp -d Brother_DCP_T720DW_USB
```

#### Coin Acceptor

```bash
sudo journalctl -u coin-listener -f
```

- [ ] Insert coin - balance updates on screen

#### USB Drive

- [ ] Insert USB with PDF files
- [ ] Files appear in application

#### Mobile Upload (Phone/Tablet)

From a phone connected to the WiFi hotspot:

1. Open browser and go to: `http://pisoprinting.connect/mobile/upload`
2. Or via mDNS (if on same LAN): `http://pisoprint.local/mobile/upload`

- [ ] Mobile upload page loads with sky-blue theme
- [ ] Can select and upload a PDF file
- [ ] Upload success page shows file details
- [ ] Uploaded file appears on kiosk for printing

### 20.4 Service Status Check

```bash
sudo systemctl status nginx php8.3-fpm mariadb cups laravel-queue coin-listener hostapd dnsmasq avahi-daemon
```

All should show: **Active (running)**

### 20.5 Full Workflow Test

1. ✓ Connect phone to WiFi hotspot
2. ✓ Open http://pisoprinting.connect/mobile/upload on phone
3. ✓ Upload a PDF file from phone (or insert USB with PDF on kiosk)
4. ✓ Go to kiosk and select the uploaded file
5. ✓ Insert coins to add balance
6. ✓ Select print options
7. ✓ Print document
8. ✓ Verify printed output

**🎉 Deployment Complete!**

---

## Troubleshooting

### Web Application Not Loading

```bash
# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check PHP-FPM
sudo systemctl status php8.3-fpm
sudo tail -f /var/log/php8.3-fpm.log

# Check Laravel logs
tail -f /var/www/pisoprint/storage/logs/laravel.log

# Clear cache
cd /var/www/pisoprint
php artisan cache:clear
php artisan config:clear
```

### Vite Manifest Not Found Error

This error means the frontend build files are missing or have permission issues:

```bash
# Check if build exists
ls -la /var/www/pisoprint/public/build/

# If missing, rebuild on your dev machine and transfer:
# On dev machine:
npm run build
scp -r public/build pisoprint@<PI_IP>:/var/www/pisoprint/public/

# Fix permissions on Pi
sudo chown -R www-data:www-data /var/www/pisoprint/public/build
sudo chmod -R 755 /var/www/pisoprint/public/build

# Clear Laravel cache
cd /var/www/pisoprint
php artisan optimize:clear
php artisan config:cache
```

### Touch Scrolling Not Working

If finger scrolling doesn't work on the touchscreen:

```bash
# Check if using Wayland (problematic)
grep -E 'session=' /etc/lightdm/lightdm.conf | grep -v '^#'

# If shows rpd-labwc, switch to X11:
sudo sed -i 's/autologin-session=rpd-labwc/autologin-session=rpd-x/' /etc/lightdm/lightdm.conf
sudo sed -i 's/user-session=rpd-labwc/user-session=rpd-x/' /etc/lightdm/lightdm.conf
sudo sed -i 's/greeter-session=pi-greeter-labwc/greeter-session=pi-greeter/' /etc/lightdm/lightdm.conf

# Reboot required
sudo reboot
```

### Emojis Not Rendering

```bash
# Install emoji fonts
sudo apt install -y fonts-noto-color-emoji

# Refresh font cache
sudo fc-cache -fv

# Restart kiosk
pkill chromium
DISPLAY=:0 /home/pisoprint/start-kiosk.sh &
```

### Printer Not Working

```bash
# Check CUPS
sudo systemctl status cups
lpstat -p -d
sudo tail -f /var/log/cups/error_log

# Check printer connection
lsusb | grep Brother

# Restart CUPS
sudo systemctl restart cups
```

### Coin Acceptor Not Detecting

```bash
# Check serial port
ls -la /dev/ttyUSB*

# Set permissions
sudo chmod 666 /dev/ttyUSB0

# Check service
sudo journalctl -u coin-listener -f

# Restart service
sudo systemctl restart coin-listener
```

### WiFi Hotspot Not Working

```bash
# Check services
sudo systemctl status hostapd
sudo systemctl status dnsmasq

# Unblock WiFi
sudo rfkill unblock wifi

# Restart services
sudo systemctl restart dhcpcd hostapd dnsmasq
```

### USB Drive Not Detected

```bash
# Check device
lsblk
dmesg | tail -20

# Check log
tail /var/log/usb-manager.log

# Reload udev
sudo udevadm control --reload-rules
```

### Kiosk Script Syntax Errors

If the kiosk won't start due to script errors:

```bash
# Check for syntax errors
bash -n /home/pisoprint/start-kiosk.sh

# Recreate the script (copy from Step 19.4)
# Make sure no escape characters are corrupted
```

---

## Maintenance & Updates

### Weekly Maintenance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clear old logs
sudo journalctl --vacuum-time=7d
find /var/www/pisoprint/storage/logs -type f -mtime +7 -delete
```

### Application Updates

> ⚠️ **IMPORTANT**: You must build on your development machine, not on the Pi.

```bash
# On Raspberry Pi - Backup database first
cd /var/www/pisoprint
mysqldump -u pisoprint -ppisoprint pisoprint > ~/backup_$(date +%Y%m%d).sql

# Pull code updates
git pull origin main

# Update PHP dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force
```

**On your development machine:**

```bash
# Build frontend
cd pisoprint
git pull origin main
npm ci
npm run build

# Transfer to Pi
scp -r public/build pisoprint@<PI_IP>:/var/www/pisoprint/public/
```

**Back on Raspberry Pi:**

```bash
# Fix permissions and clear cache
sudo chown -R www-data:www-data /var/www/pisoprint/public/build
php artisan optimize:clear
php artisan optimize

# Restart services
sudo systemctl restart php8.3-fpm nginx laravel-queue

# Restart kiosk
pkill chromium
DISPLAY=:0 nohup /home/pisoprint/start-kiosk.sh > /tmp/kiosk.log 2>&1 &
```

---

## Quick Reference

### Important Paths

| Path                                       | Description        |
| ------------------------------------------ | ------------------ |
| `/var/www/pisoprint`                       | Application root   |
| `/var/www/pisoprint/.env`                  | Environment config |
| `/var/www/pisoprint/storage/logs`          | Laravel logs       |
| `/etc/nginx/sites-available/piso-print`    | Nginx config       |
| `/etc/hostapd/hostapd.conf`                | WiFi config        |
| `/home/pisoprint/start-kiosk.sh`           | Kiosk script       |
| `/mnt/usb`                                 | USB mount point    |
| `/etc/php/8.3/fpm/conf.d/99-pisoprint.ini` | PHP upload limits  |

### Important Commands

| Command                                                       | Description       |
| ------------------------------------------------------------- | ----------------- |
| `php artisan migrate`                                         | Run migrations    |
| `php artisan optimize`                                        | Cache config      |
| `php artisan optimize:clear`                                  | Clear all caches  |
| `lpstat -p -d`                                                | Check printer     |
| `sudo systemctl restart nginx php8.3-fpm`                     | Restart web stack |
| `/home/pisoprint/exit-kiosk.sh`                               | Exit kiosk mode   |
| `pkill chromium; DISPLAY=:0 /home/pisoprint/start-kiosk.sh &` | Restart kiosk     |

### Default Credentials

| Service      | Username  | Password      |
| ------------ | --------- | ------------- |
| WiFi Hotspot | -         | PisoPrint2025 |
| MySQL        | pisoprint | pisoprint     |
| SSH          | pisoprint | pisoprint     |
| CUPS Admin   | pisoprint | pisoprint     |

### Network Information

| Service       | Address                                           |
| ------------- | ------------------------------------------------- |
| Kiosk App     | http://192.168.4.1 or http://pisoprinting.connect |
| Mobile Upload | http://pisoprinting.connect/mobile/upload         |
| mDNS Access   | http://pisoprint.local (requires Avahi/Bonjour)   |
| CUPS Web      | http://localhost:631                              |
| WiFi SSID     | PisoPrint_Kiosk                                   |
| Hotspot IP    | 192.168.4.1                                       |

---

## Support

- **GitHub Issues**: https://github.com/hisangge/pisoprint/issues
- **Email**: leodyversemilla07@gmail.com

---

**Document Version**: 2.2  
**Last Updated**: December 3, 2025  
**Changelog v2.2**:

- Added mobile upload URLs to Network Information section
- Added mDNS access URL (pisoprint.local) for local network discovery
- Updated UI: Mobile upload pages now match kiosk sky-blue theme

**Changelog v2.1**:

- Added requirement for development machine (build cannot run on Pi due to ARM incompatibility)
- Added PHP upload limits configuration (50MB)
- Added Wayland to X11 switch instructions for proper touch scrolling
- Added emoji fonts installation (fonts-noto-color-emoji)
- Updated kiosk script with touch scrolling Chromium flags
- Added troubleshooting sections for Vite manifest, touch scrolling, emojis
- Fixed application paths from `/var/www/piso-print` to `/var/www/pisoprint`
- Updated maintenance section with proper build transfer workflow

**© 2025 Piso Print System. All rights reserved.**

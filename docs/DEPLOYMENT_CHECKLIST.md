# 🚀 PisoPrint Deployment Checklist

**Version**: 1.0  
**Date**: November 13, 2025  
**Status**: Production Ready (95%)

---

## Pre-Deployment Requirements

### Hardware Components
- [ ] Raspberry Pi 4 (4GB RAM minimum)
- [ ] LAFVIN 7" Touchscreen IPS DSI Display (1024×600)
- [ ] ESP32 microcontroller
- [ ] ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor
- [ ] Brother DCP-T720DW printer (or compatible)
- [ ] WiFi USB adapter (if not using built-in WiFi)
- [ ] MicroSD card (32GB minimum, Class 10)
- [ ] USB flash drive for testing
- [ ] Philippine peso coins (₱1, ₱5, ₱10, ₱20) for testing

### Software Prerequisites
- [ ] Raspberry Pi OS Lite (64-bit) installed
- [ ] SSH access configured
- [ ] Internet connection for initial setup
- [ ] GitHub access (if cloning repository)

---

## Phase 1: System Installation (2-3 hours)

### 1.1 Base System Setup
- [ ] Flash Raspberry Pi OS to microSD card
- [ ] Boot Raspberry Pi and complete initial setup
- [ ] Update system packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Set timezone: `sudo timedatectl set-timezone Asia/Manila`
- [ ] Configure locale: `sudo dpkg-reconfigure locales`

### 1.2 Install Dependencies
- [ ] Install PHP 8.3: `sudo apt install php8.3 php8.3-cli php8.3-fpm php8.3-mysql php8.3-curl php8.3-gd php8.3-mbstring php8.3-xml php8.3-zip`
- [ ] Install Composer: `curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer`
- [ ] Install Node.js 20: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
- [ ] Install MySQL: `sudo apt install mysql-server`
- [ ] Install CUPS: `sudo apt install cups`
- [ ] Install Chromium: `sudo apt install chromium-browser unclutter`

### 1.3 Clone and Configure Project
- [ ] Clone repository: `cd /var/www && sudo git clone https://github.com/leodyversemilla07/piso-print.git`
- [ ] Set permissions: `sudo chown -R www-data:www-data piso-print`
- [ ] Copy environment: `cp .env.example .env`
- [ ] Configure `.env` file (database, app key, etc.)
- [ ] Install PHP dependencies: `composer install --optimize-autoloader --no-dev`
- [ ] Install Node dependencies: `npm ci`
- [ ] Generate app key: `php artisan key:generate`

### 1.4 Database Setup
- [ ] Create MySQL database: `mysql -u root -p -e "CREATE DATABASE pisoprint;"`
- [ ] Create MySQL user: `mysql -u root -p -e "CREATE USER 'pisoprint'@'localhost' IDENTIFIED BY 'your_password';"`
- [ ] Grant privileges: `mysql -u root -p -e "GRANT ALL PRIVILEGES ON pisoprint.* TO 'pisoprint'@'localhost';"`
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Seed database: `php artisan db:seed --force`

### 1.5 Build Frontend
- [ ] Build production assets: `npm run build`
- [ ] Verify build output in `public/build/`
- [ ] Test asset loading: `curl http://localhost/build/manifest.json`

---

## Phase 2: Hardware Integration (3-4 hours)

### 2.1 ESP32 Firmware Upload
- [ ] Connect ESP32 to development computer
- [ ] Install PlatformIO CLI
- [ ] Navigate to `esp32-firmware/piso-print-coin-acceptor/`
- [ ] Build firmware: `pio run`
- [ ] Upload firmware: `pio run --target upload`
- [ ] Open serial monitor: `pio device monitor`
- [ ] Verify firmware version in serial output

### 2.2 Coin Acceptor Wiring
- [ ] Follow wiring diagram in `esp32-firmware/WIRING.md`
- [ ] Connect ALLAN coinslot to ESP32 GPIO 34
- [ ] Connect power supply (12V for coinslot, 5V for ESP32)
- [ ] Verify LED indicators on ESP32
- [ ] Test coin detection with serial monitor

### 2.3 Coin Acceptor Calibration
- [ ] Insert ₱1 coin → Verify "COIN:1.00" in serial output
- [ ] Insert ₱5 coin → Verify "COIN:5.00" in serial output
- [ ] Insert ₱10 coin → Verify "COIN:10.00" in serial output
- [ ] Insert ₱20 coin → Verify "COIN:20.00" in serial output
- [ ] Test 10 consecutive insertions for reliability
- [ ] Adjust pulse count thresholds if needed (in firmware)

### 2.4 Printer Configuration
- [ ] Connect Brother DCP-T720DW via USB or network
- [ ] Install printer drivers: `sudo apt install printer-driver-brlaser`
- [ ] Add printer to CUPS: `lpadmin -p BrotherPrinter -v usb://Brother/DCP-T720DW -m everywhere`
- [ ] Set as default: `lpoptions -d BrotherPrinter`
- [ ] Test print: `echo "Test" | lp -d BrotherPrinter`
- [ ] Verify print job status: `lpstat -o`

### 2.5 Display Configuration
- [ ] Connect LAFVIN 7" touchscreen to DSI port
- [ ] Enable DSI display: Add to `/boot/config.txt`:
  ```
  dtoverlay=vc4-kms-dsi-7inch
  ```
- [ ] Reboot: `sudo reboot`
- [ ] Calibrate touchscreen: `sudo apt install xinput-calibrator && xinput_calibrator`
- [ ] Test touch input with Chromium

---

## Phase 3: Service Configuration (1-2 hours)

### 3.1 Run Quick Setup Script
```bash
cd /var/www/piso-print/scripts
sudo ./quick-setup.sh
```

This automated script will:
- [ ] Install all system services
- [ ] Configure WiFi hotspot
- [ ] Set up USB auto-mount
- [ ] Configure kiosk mode
- [ ] Enable and start all services

### 3.2 Manual Service Verification (if quick-setup fails)

**WiFi Hotspot Setup:**
```bash
sudo ./wifi-manager.sh setup-hotspot
sudo ./wifi-manager.sh status
```

**USB Auto-mount Setup:**
```bash
sudo ./usb-manager.sh setup
sudo ./usb-manager.sh status
```

**Kiosk Mode Setup:**
```bash
sudo ./kiosk-manager.sh setup
sudo ./kiosk-manager.sh status
```

**System Services:**
```bash
sudo ./service-manager.sh install
sudo ./service-manager.sh status
```

### 3.3 Verify Service Status
- [ ] ESP32 listener: `sudo systemctl status piso-print-esp32`
- [ ] Job monitor: `sudo systemctl status piso-print-job-monitor`
- [ ] Kiosk UI: `sudo systemctl status piso-print-kiosk`
- [ ] USB watcher: `sudo systemctl status pisoprint-usb-watcher`
- [ ] WiFi hotspot: `sudo systemctl status hostapd dnsmasq`

### 3.4 Check Service Logs
- [ ] ESP32 listener: `sudo journalctl -u piso-print-esp32 -f`
- [ ] Job monitor: `sudo journalctl -u piso-print-job-monitor -f`
- [ ] Kiosk UI: `sudo journalctl -u piso-print-kiosk -f`
- [ ] Application logs: `tail -f storage/logs/laravel.log`

---

## Phase 4: Testing & Validation (2-3 hours)

### 4.1 WiFi Upload Test ✅ **Priority: High**
- [ ] Connect phone to "PisoPrint_Kiosk" hotspot (Password: PisoPrint2025)
- [ ] Open browser and navigate to http://192.168.4.1/mobile/upload
- [ ] Upload a test PDF file (5-10 pages)
- [ ] Verify file appears on kiosk home screen as "pending upload"
- [ ] Click "Preview & Print This File" button
- [ ] Verify PDF information (filename, page count)

### 4.2 USB Upload Test ⚠️ **Priority: Medium**
- [ ] Insert USB flash drive with PDF files
- [ ] Wait 1-2 seconds for detection
- [ ] Check logs: `sudo journalctl -u pisoprint-usb-watcher -n 20`
- [ ] Verify files copied to `storage/app/uploads/usb/`
- [ ] Check application log for API call: `tail -f storage/logs/laravel.log | grep usb`
- [ ] Verify notification appears on home screen (if not, USB browsing UI incomplete)

### 4.3 Print Configuration Test
- [ ] Open preview page
- [ ] Select Black & White mode → Verify cost: ₱2/page
- [ ] Select Grayscale mode → Verify cost: ₱3/page
- [ ] Select Color mode → Verify cost: ₱5/page
- [ ] Change copies to 2 → Verify cost doubles
- [ ] Test cost calculation API: `curl -X POST http://localhost/kiosk/calculate-cost -d "pages=5&copies=2&color_mode=black_and_white"`

### 4.4 Payment Flow Test (Coin Acceptor)
- [ ] Start print job from preview page
- [ ] Verify payment screen displays correct total
- [ ] Insert ₱1 coin → Verify balance updates in real-time
- [ ] Insert ₱5 coin → Verify balance updates
- [ ] Insert ₱10 coin → Verify balance updates
- [ ] Continue until full payment received
- [ ] Verify automatic redirect to print status page

### 4.5 Print Job Execution Test
- [ ] Monitor print status page
- [ ] Verify job submitted to CUPS: `lpstat -o`
- [ ] Watch printer for physical print job
- [ ] Verify page counter updates: "Printing page X of Y"
- [ ] Check completion status
- [ ] Verify transaction logged in database: `mysql -u pisoprint -p pisoprint -e "SELECT * FROM transactions ORDER BY id DESC LIMIT 5;"`

### 4.6 Admin Dashboard Test
- [ ] Access admin panel: http://localhost/login
- [ ] Login with admin credentials (created during seeding)
- [ ] Verify dashboard statistics (revenue, jobs, etc.)
- [ ] Check print jobs list
- [ ] View transaction history
- [ ] Test settings modification (pricing, WiFi, etc.)

### 4.7 Error Handling Test
- [ ] Test paper jam simulation (stop printer mid-print)
- [ ] Test USB drive removal during scan
- [ ] Test WiFi upload with oversized file (>50MB)
- [ ] Test invalid file type upload (non-PDF)
- [ ] Test payment cancellation
- [ ] Verify error messages displayed correctly
- [ ] Check error logging: `tail -f storage/logs/laravel.log`

---

## Phase 5: Performance & Security (1-2 hours)

### 5.1 Performance Optimization
- [ ] Enable OPcache: Uncomment in `/etc/php/8.3/fpm/php.ini`
- [ ] Configure queue worker: `sudo systemctl enable piso-print-queue`
- [ ] Set up log rotation: `sudo nano /etc/logrotate.d/pisoprint`
- [ ] Optimize MySQL: `sudo mysql_secure_installation`

### 5.2 Security Hardening
- [ ] Change default passwords (MySQL, admin user)
- [ ] Configure firewall: `sudo ufw enable && sudo ufw allow 22,80,443`
- [ ] Disable SSH password auth (use keys only)
- [ ] Set file permissions: `sudo chmod -R 755 /var/www/piso-print/storage`
- [ ] Disable unused services: `sudo systemctl disable bluetooth`

### 5.3 Backup Configuration
- [ ] Create backup script: `sudo nano /usr/local/bin/pisoprint-backup.sh`
- [ ] Schedule daily backups: `sudo crontab -e` → Add `0 2 * * * /usr/local/bin/pisoprint-backup.sh`
- [ ] Test backup restoration process
- [ ] Document backup location and procedure

---

## Phase 6: Production Readiness (30 min - 1 hour)

### 6.1 Final Checks
- [ ] Verify all services running: `sudo ./scripts/service-manager.sh status`
- [ ] Check disk space: `df -h` (ensure >5GB free)
- [ ] Test system reboot: `sudo reboot` → Wait 2 minutes → Verify all services auto-start
- [ ] Test kiosk auto-start after reboot
- [ ] Verify WiFi hotspot reconnects after reboot

### 6.2 Documentation
- [ ] Print quick reference guide for maintenance
- [ ] Document admin credentials (secure location)
- [ ] Create troubleshooting flowchart
- [ ] Record hardware serial numbers
- [ ] Take photos of wiring setup

### 6.3 User Acceptance Testing
- [ ] Have actual users test the workflow
- [ ] Observe for usability issues
- [ ] Collect feedback on UI/UX
- [ ] Note any confusion points
- [ ] Make adjustments as needed

---

## Known Issues & Workarounds

### ⚠️ USB File Browser Not Implemented
**Issue**: USB detection works (files copied to storage), but kiosk doesn't show file browser.  
**Workaround**: Files appear as "pending upload" notification on home screen. User clicks notification to proceed.  
**Status**: Backend API complete, frontend UI in development.  
**Impact**: Low - WiFi upload is fully functional alternative.

### ⚠️ PDF Preview Not Implemented
**Issue**: PDF.js library installed, but preview component not created.  
**Workaround**: Users configure settings without seeing actual document preview.  
**Status**: Infrastructure ready, component implementation pending.  
**Impact**: Medium - Users can't verify document content before printing.

### ⚠️ Polling Instead of WebSockets
**Issue**: Uses 500ms polling for payment status instead of real-time WebSockets.  
**Workaround**: Works acceptably for single-kiosk deployment.  
**Status**: Functional, optimization possible with Laravel Reverb.  
**Impact**: Low - Performance acceptable for use case.

---

## Post-Deployment Monitoring

### Daily Checks
- [ ] Check printer paper level
- [ ] Verify coin acceptor functionality
- [ ] Review transaction logs for anomalies
- [ ] Check disk space: `df -h`
- [ ] Monitor service status: `sudo systemctl status piso-print-*`

### Weekly Checks
- [ ] Empty coin acceptor collection box
- [ ] Clean printer (inkjet heads, paper path)
- [ ] Review error logs: `tail -f storage/logs/laravel.log`
- [ ] Check database size: `du -sh /var/lib/mysql/pisoprint`
- [ ] Test backup restoration

### Monthly Checks
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Clean touchscreen display
- [ ] Verify WiFi hotspot range and stability
- [ ] Review admin dashboard analytics
- [ ] Optimize database: `php artisan db:optimize`

---

## Emergency Troubleshooting

### Kiosk Won't Start
```bash
# Check service status
sudo systemctl status piso-print-kiosk

# Restart kiosk
sudo systemctl restart piso-print-kiosk

# Check logs
sudo journalctl -u piso-print-kiosk -n 50
```

### Coin Acceptor Not Working
```bash
# Check ESP32 service
sudo systemctl status piso-print-esp32

# Check serial connection
ls -l /dev/ttyUSB*

# Restart ESP32 listener
sudo systemctl restart piso-print-esp32

# Monitor serial output
sudo journalctl -u piso-print-esp32 -f
```

### Printer Not Responding
```bash
# Check CUPS status
sudo systemctl status cups

# List printers
lpstat -p -d

# Check print queue
lpstat -o

# Cancel all jobs
cancel -a

# Restart CUPS
sudo systemctl restart cups
```

### WiFi Hotspot Not Working
```bash
# Check services
sudo systemctl status hostapd dnsmasq

# Restart WiFi
sudo ./scripts/wifi-manager.sh restart

# Check IP address
ip addr show wlan0

# Test DHCP
sudo tail -f /var/log/syslog | grep dnsmasq
```

---

## Support & Resources

- **Main Documentation**: [docs/PISO_PRINT_DOCUMENTATION.md](docs/PISO_PRINT_DOCUMENTATION.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Raspberry Pi Setup**: [docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md](docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md)
- **WiFi Troubleshooting**: [docs/WIFI_HOTSPOT_TROUBLESHOOTING.md](docs/WIFI_HOTSPOT_TROUBLESHOOTING.md)
- **ESP32 Firmware**: [esp32-firmware/README.md](esp32-firmware/README.md)
- **Test Coverage**: [docs/TEST_COVERAGE_REPORT.md](docs/TEST_COVERAGE_REPORT.md)

---

## Deployment Sign-Off

### Deployment Team
- **Deployed By**: ___________________________
- **Date**: ___________________________
- **Location**: ___________________________

### Verification Sign-Off
- [ ] Hardware installation complete
- [ ] Software configuration verified
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Training provided
- [ ] Backup configured
- [ ] Monitoring enabled

**Signature**: ___________________________  
**Date**: ___________________________

---

**🎉 Congratulations! Your PisoPrint kiosk is ready for production use.**

**Next Steps**:
1. Monitor first 24 hours closely
2. Collect user feedback
3. Address any usability issues
4. Schedule regular maintenance
5. Plan for future enhancements (see [docs/11_future_enhancements.md](docs/11_future_enhancements.md))

# Raspberry Pi Setup Checklist

This checklist covers critical steps that must be completed before and after deployment on Raspberry Pi.

## 📋 Pre-Deployment (On Development Machine)

- [ ] **Update package.json** - ARM64 dependencies added ✅
- [ ] **Commit and push all changes**
  ```bash
  git add .
  git commit -m "feat: add ARM64 support and security improvements"
  git push origin main
  ```

## 🔧 Post-Deployment (On Raspberry Pi)

### Step 1: Create Log Directories

```bash
# Create log directory for systemd services
sudo mkdir -p /var/log/piso-print
sudo chown leodyversemilla07:leodyversemilla07 /var/log/piso-print
sudo chmod 755 /var/log/piso-print
```

### Step 2: Configure Nginx Upload Limits

```bash
# Edit Nginx site configuration
sudo nano /etc/nginx/sites-available/piso-print
```

Add inside the `server` block:

```nginx
server {
    listen 80;
    server_name localhost 192.168.1.15;
    
    # Add this line for file uploads
    client_max_body_size 50M;
    
    root /home/leodyversemilla07/piso-print/public;
    # ... rest of configuration
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Configure PHP Upload Limits

```bash
# Edit PHP-FPM configuration
sudo nano /etc/php/8.3/fpm/php.ini
```

Update these values:

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

```bash
# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

### Step 4: Install PDF Processing Tools

```bash
# Install poppler-utils for PDF info extraction
sudo apt install -y poppler-utils

# Verify installation
pdfinfo --version
```

### Step 5: Ensure Serial Port Access

```bash
# Add user to dialout group (for ESP32 access)
sudo usermod -a -G dialout leodyversemilla07
sudo usermod -a -G dialout www-data

# Verify group membership
groups leodyversemilla07
groups www-data

# Logout and login for changes to take effect
# Or reboot: sudo reboot
```

### Step 6: Verify File Permissions

```bash
# Home directory execute permission (CRITICAL for Nginx)
chmod +x /home/leodyversemilla07

# Storage and cache permissions
sudo chown -R leodyversemilla07:www-data /home/leodyversemilla07/piso-print/storage
sudo chown -R leodyversemilla07:www-data /home/leodyversemilla07/piso-print/bootstrap/cache
sudo chmod -R 775 /home/leodyversemilla07/piso-print/storage
sudo chmod -R 775 /home/leodyversemilla07/piso-print/bootstrap/cache
```

### Step 7: Test ARM64 Build

```bash
cd ~/piso-print

# Clean install with ARM64 support
rm -rf node_modules
npm install --force --arch=arm64

# Build assets
npm run build

# Verify build completed successfully
ls -lh public/build/
```

### Step 8: Verify Database Setup

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Test database connection
mysql -u pisoprint -p piso_print -e "SHOW TABLES;"

# Run migrations if needed
php artisan migrate --force
```

### Step 9: Start and Enable Services

```bash
# Start ESP32 listener service
sudo systemctl enable piso-print-esp32
sudo systemctl start piso-print-esp32
sudo systemctl status piso-print-esp32

# Start print job monitor
sudo systemctl enable piso-print-job-monitor
sudo systemctl start piso-print-job-monitor
sudo systemctl status piso-print-job-monitor

# Check service logs
sudo journalctl -u piso-print-esp32 -f
sudo journalctl -u piso-print-job-monitor -f
```

### Step 10: Test CUPS Printer

```bash
# List available printers
lpstat -p -d

# Print test page
echo "Test print from Piso Print" | lp

# Check print queue
lpstat -o

# Check printer status
lpstat -p Brother-DCP-T720DW -l
```

### Step 11: Test Web Application

```bash
# Test local access
curl http://localhost

# Check for errors in logs
tail -f storage/logs/laravel.log
tail -f /var/log/piso-print/error.log
```

### Step 12: Configure Kiosk Mode (Final Step)

```bash
# Enable kiosk service
sudo systemctl enable piso-print-kiosk
sudo systemctl start piso-print-kiosk

# Verify Chromium is running
ps aux | grep chromium

# Check display
DISPLAY=:0 xrandr
```

## ✅ Verification Tests

### Test 1: Web Access
- [ ] Open browser to `http://192.168.1.15`
- [ ] Verify homepage loads
- [ ] Check touch scrolling works
- [ ] Verify emojis render correctly

### Test 2: File Upload
- [ ] Upload a PDF file (< 50MB)
- [ ] Verify page count detected
- [ ] Check preview displays

### Test 3: Payment System
- [ ] Insert coin (if hardware available)
- [ ] Check Laravel logs for coin detection
- [ ] Verify credit updates on screen

### Test 4: Printing
- [ ] Submit print job
- [ ] Monitor CUPS queue: `watch -n 1 lpstat -o`
- [ ] Verify pages print correctly
- [ ] Check job completion in database

### Test 5: System Services
```bash
# Check all services are running
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mariadb
sudo systemctl status piso-print-esp32
sudo systemctl status piso-print-job-monitor
sudo systemctl status piso-print-kiosk
```

### Test 6: Error Handling
- [ ] Test with invalid PDF
- [ ] Test with oversized file (> 50MB)
- [ ] Test printer offline scenario
- [ ] Test ESP32 disconnect/reconnect

## 🔍 Performance Monitoring

### Check Resource Usage
```bash
# CPU and Memory
htop

# Disk space
df -h

# Check Laravel logs
tail -f storage/logs/laravel.log

# Check Nginx logs
sudo tail -f /var/log/piso-print/access.log
sudo tail -f /var/log/piso-print/error.log

# Check systemd service logs
sudo journalctl -u piso-print-esp32 --since "1 hour ago"
sudo journalctl -u piso-print-job-monitor --since "1 hour ago"
```

### Memory Usage Targets
- **Idle**: < 2GB RAM used
- **During print job**: < 3GB RAM used
- **Chromium browser**: < 500MB RAM used

### Performance Benchmarks
- [ ] Page load time < 5 seconds
- [ ] Touch response < 100ms
- [ ] Coin detection < 300ms
- [ ] Print job submission < 2 seconds

## 🚨 Common Issues & Solutions

### Issue: 403 Forbidden Error
**Solution**: Check home directory permission
```bash
chmod +x /home/leodyversemilla07
```

### Issue: Upload fails for large files
**Solution**: Check PHP and Nginx limits
```bash
grep upload_max_filesize /etc/php/8.3/fpm/php.ini
grep client_max_body_size /etc/nginx/sites-available/piso-print
```

### Issue: ESP32 not detected
**Solution**: Check serial port permissions
```bash
ls -l /dev/ttyUSB0
groups leodyversemilla07
sudo usermod -a -G dialout leodyversemilla07
```

### Issue: npm build fails with "Illegal instruction"
**Solution**: Reinstall with ARM64 architecture
```bash
rm -rf node_modules
npm install --force --arch=arm64
npm run build
```

### Issue: Touch scrolling doesn't work
**Solution**: Ensure X11 is active (not Wayland)
```bash
echo $XDG_SESSION_TYPE  # Should be "x11"
sudo raspi-config nonint do_wayland W1
sudo reboot
```

### Issue: Emojis show as boxes
**Solution**: Install emoji fonts
```bash
sudo apt install fonts-noto-color-emoji
fc-cache -f -v
```

## 📝 Notes

- All commands assume user is `leodyversemilla07`
- Adjust IP addresses (192.168.1.15) to match your setup
- Some steps require logout/reboot to take effect
- Test each step before proceeding to the next
- Keep deployment logs for troubleshooting

## 🔗 Related Documentation

- **Main Deployment Guide**: `docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md`
- **ESP32 Setup**: `esp32-firmware/README.md`
- **System Architecture**: `docs/03_system_architecture.md`
- **Troubleshooting**: See RASPBERRY_PI_DEPLOYMENT_GUIDE.md § Troubleshooting

---

**Last Updated**: November 3, 2025  
**Version**: 1.0

# 7. User Guide

## 7.1 For Users

This section provides step-by-step instructions for using the Piso Print System.

### 7.1.1 Getting Started

**Prerequisites:**
- **For USB printing:** USB flash drive with PDF file
- **For WiFi printing:** Smartphone or laptop with PDF file
- Philippine peso coins (₱1, ₱5, ₱10, or ₱20) for payment

**Method 1: USB Drive Printing (Recommended for Quick Prints)**
1. Prepare your PDF file on a USB flash drive
2. Approach the kiosk
3. Insert your USB drive into the USB port
4. Proceed to file selection (touchscreen will show your files)

**Method 2: WiFi Upload Printing (For Phone/Laptop Users)**
1. On your phone/laptop, go to WiFi settings
2. Connect to WiFi network: **"PisoPrint_Kiosk"**
   - Password: **PisoPrint2025**
3. Open your web browser (Chrome, Safari, Firefox, Edge)
4. Navigate to: **http://pisoprint.local/mobile/upload**
5. Upload your PDF file via the web interface

> **Important Security Note:** External devices (phones/laptops) can only access the upload page for security reasons. The full kiosk interface with payment and printing controls is restricted to the kiosk touchscreen only. If you try to access other parts of the system from your device, you'll see an "Access Restricted" message and be redirected to the upload page.
6. Wait for upload confirmation (shows page count and cost)
7. Disconnect from WiFi
8. Go to the kiosk touchscreen
9. Select your uploaded file from "Recent Uploads"
10. Proceed to payment

### 7.1.2 Printing a Document

**Step 1: Start Your Session**
1. Approach the kiosk and locate the LAFVIN 7 Inch Touchscreen IPS DSI Display
2. Tap the large **"START PRINTING NOW"** button
3. System navigates to File Selection screen

**Step 2: Upload Your File**

**Option A: USB Drive (Recommended for speed)**
1. Insert USB flash drive into any USB port on the kiosk
2. Wait 1-2 seconds for auto-detection
3. Browse and tap your PDF file
4. System loads file automatically

**Option B: WiFi Upload (For phone/laptop)**
1. On your device, connect to WiFi: **"PisoPrint_Kiosk"**
   - Password: **"PisoPrint2025"**
2. Open browser and go to: **http://pisoprint.local**
4. Upload your PDF file (drag-and-drop or file picker)
5. Wait for upload confirmation
6. Go to kiosk touchscreen
7. Tap **"Recent Uploads"** and select your file

**Step 3: Configure Print Settings**
1. Select **Number of Copies** (1-100, default: 1)
2. Choose **Color Mode**:
   - Black & White: ₱2 per page
   - Grayscale: ₱3 per page
   - Color: ₱5 per page
3. Enable **Double-Sided** (Yes/No, default: No)
4. Choose **Orientation** (Portrait/Landscape, default: Portrait)

**Note:** Paper size is fixed to Letter (8.5" × 11") only. Since the printer is enclosed in the kiosk with a single paper tray, changing paper sizes is not practical. The system is designed for Letter size paper exclusively.

**Step 4: Review Cost**
- System displays **Total Cost** prominently
- Example: 5 pages × ₱3 × 1 copy = **₱15**
- If satisfied, tap **"Continue"** button

**Step 5: Insert Coins**
1. Locate coin slot below the touchscreen
2. Insert coins one at a time: ₱1, ₱5, ₱10, or ₱20
3. Watch progress bar update in real-time
4. Screen shows: "₱X of ₱Y (₱Z remaining)"
5. When payment complete, success message appears
6. System auto-proceeds to printing (2-second delay)

**Step 6: Wait for Printing**
- Progress bar shows printing status
- "Printing page X of Y" updates in real-time
- Typical print time: 3-5 seconds per page

**Step 7: Collect Your Document**
- "Print Complete!" message appears
- Collect pages from printer output tray
- System automatically resets after 2 seconds

**Important Notes:**
- Once coins inserted, cannot be refunded (hardware limitation)
- Overpayment is not refunded (insert exact amount if possible)
- Session expires after 5 minutes of inactivity

### 7.1.3 Troubleshooting Common Issues

To see your previous print jobs:

1. Click **"Print History"** in the menu
2. View list of your past jobs:
   - File name
   - Date and time
   - Pages printed
   - Cost
   - Status (completed/failed)
3. History is session-based (cleared when you close browser)

### 7.1.6 Troubleshooting Common Issues

**Problem: Coin not accepted**
- **Cause**: Coin may be dirty, damaged, or wrong denomination
- **Solution**: Try a different ₱1 coin, ensure it's clean and genuine

**Problem: Balance not updating**
- **Cause**: Network connection issue or system delay
- **Solution**: Wait 5-10 seconds, refresh page (F5), check touchscreen display for balance update

**Problem: Upload failed**
- **Cause**: File too large, unsupported format, or network issue
- **Solution**: 
  - Check file size (max 50MB)
  - Ensure file is in PDF format
  - Try uploading again

**Problem: Print job stuck**
- **Cause**: Printer issue (paper jam, no paper, no ink)
- **Solution**:
  - Check printer status LEDs for error indicators
  - Notify staff/administrator
  - Your credits will not be deducted if print fails

**Problem: Printed pages missing or cut off**
- **Cause**: Wrong page size or orientation
- **Solution**:
  - Check document settings before printing
  - Use Letter paper size (default, 8.5" × 11")
  - Ensure document margins are correct

**Problem: Can't access web interface**
- **Cause**: Not connected to network or wrong URL
- **Solution**:
  - Verify Wi-Fi connection
  - Check URL on system display
  - Try `http://pisoprint.local` or `http://192.168.1.100`

### 7.1.4 Tips for Best Results

1. **Use PDF format** (only supported format)
2. **Upload first, review cost, then decide** (no blind payments)
3. **Choose B&W mode** to save money (₱2 vs ₱5 per page)
4. **Verify page count** before proceeding to payment
5. **Insert exact amount if possible** (no change given, overpayment not refunded)
6. **Keep files under 50MB** for faster upload
7. **Collect all pages immediately** to avoid mixing with other users

## 7.2 For Administrators

**Daily Maintenance:**

**Morning Checklist:**
- [ ] Check paper supply (refill if < 50 sheets)
- [ ] Verify ink/toner levels (Brother DCP-T720DW status)
- [ ] Empty coin collection box
- [ ] Clear any paper jams
- [ ] Review overnight error logs
- [ ] Check system disk space (should be > 20% free)

**Evening Checklist:**
- [ ] Count and record coins collected
- [ ] Reconcile with system transaction logs
- [ ] Review day's print jobs and revenue
- [ ] Check for failed jobs
- [ ] Backup database (automatic at 2:00 AM, verify)

**System Management:**

**Start System:**
```bash
# Boot Raspberry Pi
sudo systemctl start nginx
sudo systemctl start php8.3-fpm
sudo systemctl start mysql
sudo systemctl start cups

# Verify Laravel application
cd /var/www/piso-print
php artisan about
php artisan queue:work --daemon  # For job processing
```

**Check Logs:**
```bash
# View Laravel logs
tail -f /var/www/piso-print/storage/logs/laravel.log

# View recent application logs (last 50 entries)
cd /var/www/piso-print
php artisan tinker
>>> \App\Models\SystemLog::latest()->take(50)->get();
```

**Printer Management:**
```bash
# Check printer status
lpstat -p -d

# Test print
lp -d PisoPrint_Brother test.txt

# Restart CUPS
sudo systemctl restart cups
```

**Update Pricing (via Config File):**
1. Edit configuration: `nano /var/www/piso-print/config/printing.php`
2. Update pricing values:
   ```php
   'pricing' => [
       'bw' => 2.00,        // ₱2 per page
       'grayscale' => 3.00, // ₱3 per page
       'color' => 5.00,     // ₱5 per page
   ],
   ```
3. Save file and clear config cache: `php artisan config:clear`

**Backup Database:**
```bash
# Manual MySQL backup
mysqldump -u root -p piso_print > /var/backups/pisoprint/backup-$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p piso_print < /var/backups/pisoprint/backup-20251029.sql
```

**Common Troubleshooting:**

| Problem | Solution |
|---------|----------|
| Printer offline | Check USB cable, power, restart printer |
| Coin not accepted | Clean coin acceptor, try different coin |
| System unresponsive | Reboot Raspberry Pi: `sudo reboot` |
| No WiFi hotspot | Restart hostapd: `sudo systemctl restart hostapd` |

**System Status Indicators:**

| Indicator | Status | Meaning |
|-----------|--------|---------|
| Touchscreen "System Ready" | ✓ Normal | Laravel app running, ready for operation |
| Touchscreen "No Connection" | ✗ Error | Cannot reach Laravel backend |
| Printer green LED solid | ✓ Normal | Printer ready |
| Printer orange LED flashing | ⚠ Warning | Low paper or ink |
| Printer red LED | ✗ Error | Printer error (jam, door open) |

### 7.2.2 Daily Maintenance

**Morning Checklist:**
- [ ] Check paper supply (refill if < 50 sheets)
- [ ] Verify ink/toner levels
- [ ] Empty coin collection box
- [ ] Clear any paper jams
- [ ] Review overnight error logs
- [ ] Check system disk space (should be > 20% free)
- [ ] Verify network connectivity

**Evening Checklist:**
- [ ] Count and record coins collected
- [ ] Reconcile with system transaction logs
- [ ] Review day's print jobs and revenue
- [ ] Check for failed jobs and investigate causes
- [ ] Backup database
- [ ] Update any configuration changes
- [ ] Review tomorrow's scheduled maintenance

### 7.2.3 Managing Print Jobs

**Viewing Active Queue:**

1. Login to admin panel
2. Navigate to **"Print Queue"**
3. See list of all jobs:
   - Processing (being prepared)
   - Printing (actively printing)
   - Completed (finished)
   - Failed (errors occurred)

**Cancelling a Job:**

1. Find active job in list
2. Click **"Cancel"** button next to job
3. Confirm cancellation
4. System will:
   - Stop job if not yet printing
   - Mark job as cancelled
   - **Note:** No refunds due to hardware limitations (coin acceptor only)

**Clearing Stuck Jobs:**

If CUPS has stuck jobs:
1. Open terminal on Raspberry Pi
2. Run: `sudo systemctl restart cups`
3. Or from admin panel: **"Restart Print Service"**

### 7.2.4 Managing Credits and Refunds

**Manual Credit Addition:**

Use for special cases (promotions, refunds, errors):

1. Go to **"User Management"**
2. Find or create user
3. Click **"Adjust Balance"**
4. Enter amount and reason
5. Click **"Add Credits"**
6. User's balance updates immediately

**Processing Refunds:**

For failed prints or customer issues:

1. Find the affected job in **"Print History"**
2. Click **"Refund"** button
3. Verify refund amount
4. Add reason/notes
5. Confirm refund
6. Credits returned to user balance

**Clearing Balances:**

At end of day or for testing:

1. Go to **"User Management"**
2. Select user(s)
3. Click **"Clear Balance"**
4. Confirm action
5. Record reason in notes

### 7.2.5 System Configuration

**Adjusting Pricing:**

1. Navigate to **"Settings"** > **"Pricing"**
2. Current settings displayed:
   - Cost per page (default: ₱1.00)
   - Coin value (default: ₱1.00)
3. Enter new values
4. Click **"Save Changes"**
5. System updates immediately

**File Upload Limits:**

1. Go to **"Settings"** > **"File Uploads"**
2. Configure:
   - Maximum file size (default: 50MB)
   - Allowed formats
   - Upload timeout
3. Save changes

**Printer Settings:**

1. Navigate to **"Settings"** > **"Printer"**
2. Configure:
   - Default orientation (Portrait/Landscape)
   - Default quality (Draft/Normal/High)
   - Enable/disable duplex printing
3. Test settings with test print

**Note:** Paper size is fixed to Letter (8.5" × 11") only. Since the printer is enclosed in the kiosk with a single paper tray, changing paper sizes is not practical. The system is designed for Letter size paper exclusively.

### 7.2.6 Monitoring and Reports

**Revenue Reports:**

1. Go to **"Reports"** > **"Revenue"**
2. Select date range
3. View statistics:
   - Total coins collected
   - Total pages printed
   - Revenue per day
   - Average job size
4. Export to CSV or PDF

**Print Statistics:**

- **Most printed file types**
- **Peak usage hours**
- **Average pages per job**
- **Print success rate**
- **Most common errors**

**System Health:**

Dashboard shows:
- **CPU usage**: < 70% normal
- **Memory usage**: < 80% normal
- **Disk space**: > 20% free
- **Network latency**: < 100ms
- **Average response time**: < 2s

### 7.2.7 Backup and Recovery

**Manual Backup:**

1. Go to **"Maintenance"** > **"Backup"**
2. Click **"Create Backup Now"**
3. Wait for completion (usually < 1 minute)
4. Download backup file to safe location
5. Backup includes:
   - Database (users, jobs, transactions)
   - Configuration files
   - System logs

**Automatic Backups:**

Configured to run daily at 2:00 AM:
- Stored in `/var/backups/pisoprint/`
- Retained for 30 days
- Older backups automatically deleted

**Restoring from Backup:**

1. Go to **"Maintenance"** > **"Restore"**
2. Click **"Upload Backup File"**
3. Select backup file
4. Review backup details (date, size)
5. Click **"Restore"**
6. System will restart automatically
7. Login and verify data restored

**Emergency Recovery:**

If system inaccessible:
```bash
# SSH into Raspberry Pi
ssh pi@192.168.1.100

# Stop services
sudo systemctl stop nginx
sudo systemctl stop php8.3-fpm

# Restore MySQL database from backup
cd /var/backups/pisoprint/
mysql -u root -p piso_print < latest-backup.sql

# Clear Laravel cache
cd /var/www/piso-print
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Restart services
sudo systemctl start php8.3-fpm
sudo systemctl start nginx
```

### 7.2.8 Troubleshooting System Issues

**ESP32 Not Responding:**

1. Check physical connections (power, serial/Wi-Fi)
2. Check serial monitor for ESP32 status messages
3. Restart ESP32 (power cycle)
4. Check serial cable/Wi-Fi signal
5. Verify Raspberry Pi is receiving data:
   ```bash
   sudo cat /dev/ttyUSB0
   # Should show incoming data
   ```

**Printer Not Printing:**

1. Check printer power and connection
2. Verify CUPS sees printer:
   ```bash
   lpstat -p -d
   ```
3. Check printer status in admin panel
4. Print test page from CUPS: `http://localhost:631`
5. Restart CUPS if needed:
   ```bash
   sudo systemctl restart cups
   ```

**Web Interface Slow:**

1. Check CPU and memory usage
2. Clear browser cache
3. Restart PHP-FPM and Nginx:
   ```bash
   sudo systemctl restart php8.3-fpm
   sudo systemctl restart nginx
   ```
4. Clear Laravel cache:
   ```bash
   cd /var/www/piso-print
   php artisan cache:clear
   php artisan optimize:clear
   ```
5. Check for large log files:
   ```bash
   du -sh /var/www/piso-print/storage/logs/
   ```
6. Optimize database if needed:
   ```bash
   php artisan db:optimize
   ```

**Database Errors:**

1. Check disk space (may be full)
2. Review Laravel error logs:
   ```bash
   tail -f /var/www/piso-print/storage/logs/laravel.log
   ```
3. Check database integrity:
   ```bash
   mysqlcheck -u root -p piso_print
   ```
4. Repair tables if needed:
   ```bash
   mysqlcheck -u root -p --auto-repair piso_print
   ```
5. Test database connection:
   ```bash
   cd /var/www/piso-print
   php artisan tinker
   >>> DB::connection()->getPdo();
   ```
6. Restore from backup if corrupted

**Coins Not Registering:**

1. Check coin acceptor power (12V)
2. Test with known good coins
3. Check ESP32 GPIO connections
4. View ESP32 serial output for pulse detection
5. Adjust coin acceptor sensitivity if needed
6. Clean coin acceptor path

### 7.2.9 Security Best Practices

1. **Change default admin password** immediately
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Enable HTTPS** for web interface (optional but recommended)
4. **Regularly update** Raspberry Pi OS and software
5. **Restrict admin panel** to local network only
6. **Monitor logs** for suspicious activity
7. **Backup regularly** and test restores
8. **Limit physical access** to Raspberry Pi and ESP32
9. **Use firewall** to block unnecessary ports:
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

---

**Navigation:**
- [← Previous: System Modules](06_system_modules.md)
- [→ Next: System Flow](08_system_flow.md)
- [↑ Back to Index](README.md)

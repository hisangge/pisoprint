# USB Auto-Mount Logic Fixes

## Overview
Refactored the USB mounting system to fix the architecture conflict between the shell script and Laravel controller. The new approach is optimized for Raspberry Pi with limited storage.

## Key Changes

### 1. Shell Script (`scripts/usb-manager.sh`) - REFACTORED
**Old Approach (❌ Problematic):**
- Auto-copied every PDF file from USB to temporary storage immediately
- Risk: 64GB USB drive = instant SD card full + system crash
- Included inotifywait watcher service (resource-heavy for Pi)

**New Approach (✅ Optimized):**
- Mount USB drive with read permissions for `www-data`
- Send JSON notification to Laravel via curl (fire-and-forget)
- **No auto-copy** - files are read on-demand from mounted USB
- **No watcher service** - simpler, lighter-weight
- Usage: `sudo ./scripts/usb-manager.sh setup`

**What the script does:**
```bash
# 1. Install NTFS/exFAT drivers
# 2. Create udev rules to trigger on USB insertion/removal
# 3. On USB add:    Mount → Notify Laravel
# 4. On USB remove: Unmount → Clean up
```

### 2. Laravel Controller (`FileUploadController.php`) - UPDATED

**`usbDetected()` method:**
- Now handles status field from shell script
- Stores device info in cache for 15 minutes
- No longer expects auto-copied files

**`getUsbFilesData()` method:**
- Already correct! Lists files directly from `/media/usb/<device>/`
- Scans mounted USB drives without copying
- ✅ No changes needed

**`uploadFromUsb()` method:**
- Already perfect! Includes excellent security checks:
  ```php
  // Prevents directory traversal attacks
  if (! $realPath || ! str_starts_with($realPath, $mountRealPath)) { ... }
  ```
- Only copies the ONE file user selects
- ✅ No changes needed

### 3. Routes (`routes/web.php`) - NEW ENDPOINT ADDED

**New polling endpoint:**
```php
GET /api/kiosk/usb/check-status
```
- Returns: `{ detected: true|false, info: {...} }`
- Clears cache after reading (prevents continuous polling)
- Allows frontend to detect USB insertion without page reload

## Configuration

**File: `config/hardware.php`** (Already correct)
```php
'usb_mount_point' => env('USB_MOUNT_POINT', '/media/usb'),
'usb_allowed_extensions' => ['pdf', 'PDF'],
'usb_max_file_size' => 50 * 1024 * 1024, // 50MB
```

## Frontend Implementation (React/Inertia)

**In your file-selection component (`resources/js/Pages/kiosk/file-selection.jsx`):**

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function FileSelection() {
    const [usbData, setUsbData] = useState(props.usbData);

    useEffect(() => {
        // Poll every 2 seconds for USB insertion
        const interval = setInterval(() => {
            axios.get('/kiosk/api/kiosk/usb/check-status')
                .then(response => {
                    if (response.data.detected) {
                        console.log('USB detected:', response.data.info);
                        // Reload USB files data
                        axios.get('/kiosk/upload')
                            .then(res => {
                                // Parse response and update usbData
                                setUsbData(res.data.props.usbData);
                            });
                    }
                })
                .catch(err => console.error('Poll error:', err));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Rest of component...
}
```

## Setup Instructions (Raspberry Pi)

```bash
# 1. Copy the new script
sudo cp scripts/usb-manager.sh /usr/local/bin/usb-manager.sh
sudo chmod +x /usr/local/bin/usb-manager.sh

# 2. Run setup (installs drivers, creates udev rules)
sudo /usr/local/bin/usb-manager.sh setup

# 3. Verify installation
ls -la /etc/udev/rules.d/99-pisoprint-usb.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# 4. Test by inserting USB drive and checking logs
sudo journalctl -f | grep usb-manager
tail -f /var/log/usb-manager.log
```

## Security & Performance

### Security ✅
- Directory traversal protection in `uploadFromUsb()`
- Files only readable by `www-data` user (mounted with uid/gid)
- No automatic file execution or copying
- MIME type validation before use

### Performance ✅
- **No watcher service** = lower CPU usage
- **No auto-copy** = no SD card filling up
- **On-demand reading** = faster USB insertion
- **Cache-based polling** = minimal server load

## Troubleshooting

**USB not mounting?**
```bash
# Check dmesg logs
dmesg | tail -20

# Verify permissions
ls -la /media/usb/

# Test manual mount
sudo mount -t ntfs-3g /dev/sda1 /media/usb/test
```

**Files not visible in Kiosk?**
```bash
# Check if mount point has correct permissions
stat /media/usb/sda1/

# Verify www-data can read files
sudo -u www-data ls /media/usb/sda1/
```

**Polling not working?**
```bash
# Check cache
php artisan tinker
>>> cache()->get('kiosk:usb_detected')
```

## Files Modified

1. ✅ `scripts/usb-manager.sh` - Simplified, no auto-copy
2. ✅ `app/Http/Controllers/FileUploadController.php` - Updated usbDetected()
3. ✅ `routes/web.php` - Added polling endpoint
4. ⏳ `resources/js/Pages/kiosk/file-selection.jsx` - Needs polling implementation (todo)

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Auto-copy PDFs** | ❌ Yes (risky) | ✅ No (safe) |
| **Watcher Service** | ❌ Yes (heavy) | ✅ No (light) |
| **File Listing** | From temp dir | From USB mount |
| **Storage Risk** | High | None |
| **CPU Usage** | Higher | Lower |
| **Frontend Update** | Manual reload | Poll via API |

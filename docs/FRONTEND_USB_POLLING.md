# Frontend USB Polling Implementation Guide

## Quick Start

Add this to your `file-selection.jsx` component to enable automatic USB detection:

```javascript
import { useEffect } from 'react';
import axios from 'axios';

export default function FileSelection({ usbData, ...props }) {
    useEffect(() => {
        // Poll every 2 seconds to check for USB insertion
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get('/kiosk/api/kiosk/usb/check-status');
                
                if (response.data.detected) {
                    console.log('USB detected:', response.data.info);
                    
                    // Reload the page to refresh USB file list
                    // OR: Use router.reload({ only: ['usbData'] }) for partial reload
                    window.location.reload();
                }
            } catch (error) {
                // Polling errors are non-critical, silently skip
                console.debug('USB check failed:', error.message);
            }
        }, 2000); // Poll every 2 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(pollInterval);
    }, []);

    // Rest of your component code...
    return (
        // ... JSX ...
    );
}
```

## Alternative: Inertia Router Reload (Recommended)

If you want to use Inertia's partial reload feature:

```javascript
import { useEffect } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function FileSelection(props) {
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get('/kiosk/api/kiosk/usb/check-status');
                
                if (response.data.detected) {
                    console.log('USB detected, reloading USB data...');
                    
                    // Partial reload - only updates usbData prop
                    router.reload({ only: ['usbData'] });
                }
            } catch (error) {
                console.debug('USB check failed:', error.message);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, []);

    return (
        // ... your JSX ...
    );
}
```

## Advanced: With UI Feedback

Show users when USB is detected:

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function FileSelection(props) {
    const [isCheckingUSB, setIsCheckingUSB] = useState(false);
    const [usbMessage, setUsbMessage] = useState('');

    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                setIsCheckingUSB(true);
                const response = await axios.get('/kiosk/api/kiosk/usb/check-status');
                
                if (response.data.detected) {
                    const device = response.data.info?.device || 'USB Drive';
                    setUsbMessage(`📁 ${device} detected! Refreshing files...`);
                    
                    // Reload with slight delay so user sees the message
                    setTimeout(() => {
                        router.reload({ only: ['usbData'] });
                    }, 500);
                }
                setIsCheckingUSB(false);
            } catch (error) {
                setIsCheckingUSB(false);
                console.debug('USB check failed:', error.message);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, []);

    return (
        <div>
            {usbMessage && (
                <div className="alert alert-info">
                    {usbMessage}
                </div>
            )}
            
            {isCheckingUSB && (
                <div className="spinner">Checking for USB...</div>
            )}
            
            {/* Rest of your component */}
        </div>
    );
}
```

## How It Works

1. **Component Mounts** → Start polling interval
2. **Every 2 seconds** → Call `GET /kiosk/api/kiosk/usb/check-status`
3. **API Response** → Check if `detected: true`
4. **If USB found**:
   - Log the device info
   - Reload page or partial props
   - Cache is cleared (prevents repeated reloads)
5. **Component Unmounts** → Clear polling interval

## Configuration

### Polling Frequency

Adjust the interval (in milliseconds):
```javascript
}, 2000); // Change 2000 to your preferred interval
          // 1000 = 1 second (more responsive, higher CPU)
          // 3000 = 3 seconds (less responsive, lower CPU)
          // 5000 = 5 seconds (minimal, but delayed detection)
```

**Recommended: 2000ms** for good balance

### Error Handling

The polling silently continues on error (non-blocking):
```javascript
catch (error) {
    // Just log to console, don't break the polling
    console.debug('USB check failed:', error.message);
}
```

If you want stricter error handling:
```javascript
catch (error) {
    if (error.response?.status !== 404) {
        // Only log unexpected errors, ignore 404s
        console.error('USB polling error:', error);
    }
}
```

## Testing

### Test in Browser Console

```javascript
// Check USB status manually
fetch('/kiosk/api/kiosk/usb/check-status')
    .then(r => r.json())
    .then(d => console.log(d));

// Should return:
// { detected: false, info: null }
// or
// { detected: true, info: { device: "sda1", status: "mounted", detected_at: "..." } }
```

### Simulate USB Detection

On your Raspberry Pi:
```bash
# Insert USB drive
sudo /usr/local/bin/usb-manager.sh add sda1

# Check if mounted
ls /media/usb/

# Check Laravel log
tail -f storage/logs/laravel.log | grep USB
```

Then check your browser - should reload automatically!

## Files to Update

- ✅ `resources/js/Pages/kiosk/file-selection.jsx` - Add polling logic here

That's it! The backend is already configured.

# USB Polling Implementation with Inertia.js

## Overview

Implemented a complete USB file detection and polling system using Inertia.js's `usePoll` hook. The system automatically detects when USB drives are mounted and displays available PDF files for printing.

## Architecture

### 1. Backend (Laravel)

**File Upload Controller Methods:**

#### `usbDetected(Request $request): JsonResponse`
- Called by shell script when USB drive is detected
- Stores detection event in cache for 15 minutes
- Accepts both JSON and form-encoded data
- Logs detection event

#### `getUsbFilesData(): array`
- Scans `/media/usb/<device>/` directories for PDF files
- Returns array of USB drives and available files
- Validates file size against `printing.max_file_size`
- Only returns readable, accessible files

#### `uploadFromUsb(Request $request): RedirectResponse`
- Security-verified file upload from USB
- Prevents directory traversal attacks
- Validates MIME type and file size
- Copies selected file to temp storage for printing

#### New Polling Route
```php
GET /kiosk/api/kiosk/usb/check-status
```
- Returns JSON: `{ detected: true|false, info: {...} }`
- Clears cache after reading (prevents continuous reloads)

### 2. Frontend Components

#### `file-selection.tsx` (Parent Component)

**Uses Inertia's `usePoll` Hook:**
```typescript
const { stop: stopPolling } = usePoll(
    2000, // Poll every 2 seconds
    {
        only: ['usbData'],
        onSuccess: (page) => {
            // Extract and update USB data from props
            const updatedUsbData = page.props.usbData;
            setDisplayUsbData(updatedUsbData);
            
            // Stop polling once files are found
            if (updatedUsbData.files?.length > 0) {
                stopPolling();
            }
        },
    },
    {
        autoStart: usbData.files.length === 0, // Only start if no files yet
    },
);
```

**Key Features:**
- Automatically reloads only `usbData` prop every 2 seconds
- Inertia handles cleanup on component unmount
- Throttles requests by 90% when browser tab is inactive (can be disabled with `keepAlive: true`)
- Stops polling automatically when USB files are detected

#### `usb-file-browser.tsx` (Child Component)

**State Management:**
```typescript
// Use initialData props directly instead of duplicating state
const usbDrives = initialData?.usbDrives || [];
const files = initialData?.files || [];

// Track state changes for success animation
const prevFilesCountRef = useRef(0);

// Local state for loading, errors, selection
const [loading, setLoading] = useState(false);
const [selectedFile, setSelectedFile] = useState<UsbFile | null>(null);
const [showSuccess, setShowSuccess] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Prop-Driven Updates:**
```typescript
useEffect(() => {
    if (!initialData) return;
    
    const newFileCount = initialData.files?.length || 0;
    const previousFileCount = prevFilesCountRef.current;
    
    // Update error from parent
    setError(initialData.error || null);
    
    // Show success animation when new files detected
    if (newFileCount > previousFileCount && newFileCount > 0) {
        setShowSuccess(true);
        prevFilesCountRef.current = newFileCount;
        const timer = setTimeout(() => setShowSuccess(false), 3000);
        return () => clearTimeout(timer);
    }
    
    prevFilesCountRef.current = newFileCount;
}, [initialData]);
```

**Features:**
- Displays USB drives detected
- Shows list of available PDF files
- File selection with visual feedback
- Upload button for selected file
- Success notification when USB detected
- Manual refresh button
- Error handling and display

## Data Flow

```
1. USB Inserted
   ↓
2. Udev Rule Triggered
   ↓
3. Shell Script (usb-manager.sh)
   - Mount USB with read permissions
   - Call POST /kiosk/api/kiosk/usb/detected
   ↓
4. Laravel Backend
   - Store detection event in cache
   - Return success response
   ↓
5. Inertia.js usePoll Hook (2 second interval)
   - Every 2 seconds: reload only ['usbData'] prop
   ↓
6. Backend getUsbFilesData()
   - Scan /media/usb for mounted drives
   - Find all PDF files
   - Return array of files
   ↓
7. Frontend State Update
   - displayUsbData receives new files
   - usb-file-browser re-renders with files
   - Success animation shows
   ↓
8. User Action
   - Select file from list
   - Click upload button
   - File copied to temp storage
   - Redirect to print preview
   ↓
9. Polling Stops
   - stopPolling() called
   - No more requests until page reset
```

## Configuration

### Laravel Config (`config/hardware.php`)
```php
'usb_mount_point' => env('USB_MOUNT_POINT', '/media/usb'),
'usb_allowed_extensions' => ['pdf', 'PDF'],
'usb_max_file_size' => 50 * 1024 * 1024, // 50MB
```

### Shell Script (`scripts/usb-manager.sh`)
```bash
MOUNT_ROOT="/media/usb"
API_URL="http://127.0.0.1/kiosk/api/kiosk/usb/detected"
# Mounts USB with uid/gid for www-data read access
# Sends JSON curl POST on detection
```

## Polling Behavior

### Auto-Start Conditions
- **Starts automatically**: When page loads with no USB files
- **Doesn't start**: When USB files already present
- **Stops automatically**: When files detected or component unmounts

### Request Throttling
- **Active tab**: Normal polling (every 2 seconds)
- **Inactive tab**: Throttled by 90% (every 200 seconds)
- **Keep-alive mode**: Can disable throttling with `keepAlive: true` option

### Performance Optimization
- Only reloads `usbData` prop, preserves other props
- Preserves scroll position with `preserveScroll: true`
- Automatic cleanup on unmount (no manual interval clearing needed)
- Inertia handles caching and deduplication

## Error Handling

### Backend Errors
- File not found or unreadable
- Invalid file format
- File size exceeds limit
- Permission denied

### Frontend Error Display
- Alert component shows error message
- Retry button available
- Clear error when new attempt made

### Polling Error Handling
- Non-critical errors don't stop polling
- Logs to console for debugging
- Continues attempting on next interval

## User Experience

### Success Flow
1. Insert USB drive
2. Page automatically detects (2-4 seconds)
3. Green success notification appears
4. USB drives list shows
5. PDF files list shows
6. User selects file
7. Click upload button
8. File processed and sent to print preview

### Empty State
- Shows "No USB Drives Detected" message
- Waiting indicator (via polling)
- Manual "Check Again" button

### File Selection
- Click on file card to select
- Selected file highlighted in blue
- Upload button becomes active
- Shows file name in upload button

## Security Considerations

### USB Access
- Files mounted with read-only permissions for www-data
- No auto-copy (prevents SD card filling)
- On-demand file reading from mount point

### File Upload Security
- Directory traversal prevention: `realpath()` validation
- MIME type validation: `application/pdf` only
- File size limits enforced
- File moved to secure temp directory

### API Security
- CSRF protection on upload endpoint
- Request validation required
- Cache-based detection prevents unnecessary processing

## Testing

### Manual Test Flow
```bash
# 1. Insert USB drive with PDF files
# 2. Navigate to /kiosk/upload page
# 3. Should see polling start
# 4. Within 2-4 seconds, USB detected notification
# 5. PDF files appear in list
# 6. Select file and upload
```

### Debug Logging
- Browser console: `✅ USB Detected! Found X PDF file(s)`
- Laravel logs: USB detection events
- Server logs: Mount/unmount activity

## Troubleshooting

### USB Not Detected
- Check mount point: `ls /media/usb/`
- Verify script permissions: `ls -la /usr/local/bin/usb-manager.sh`
- Check udev rules: `ls -la /etc/udev/rules.d/99-pisoprint-usb.rules`

### Files Not Showing
- Verify PDF files exist: `find /media/usb -name "*.pdf"`
- Check file permissions: `stat /media/usb/sda1/file.pdf`
- Check Laravel logs for errors

### Polling Not Working
- Open browser dev tools console
- Check for network requests to `/kiosk/upload`
- Verify polling requests in Network tab
- Check for JavaScript errors

## Files Modified

- ✅ `scripts/usb-manager.sh` - Simplified mount & notify
- ✅ `routes/web.php` - Added polling endpoint
- ✅ `app/Http/Controllers/FileUploadController.php` - Updated usbDetected()
- ✅ `resources/js/pages/kiosk/file-selection.tsx` - Added usePoll hook
- ✅ `resources/js/components/usb-file-browser.tsx` - Prop-driven updates

## Benefits of Inertia.js usePoll

1. **Automatic Cleanup**: No manual interval clearing needed
2. **Smart Throttling**: Respects browser tab visibility
3. **Built-in Integration**: Works seamlessly with Inertia props
4. **Type Safety**: Full TypeScript support
5. **Performance**: Efficient polling with minimal overhead
6. **Control**: Manual start/stop methods available

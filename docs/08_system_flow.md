# 8. System Flow

> **Note:** This section reflects the **actual implementation** of the frontend application. The flow has been updated to match the working codebase, which follows a more intuitive user experience pattern: **Upload → Configure → Pay → Print** (upload-first, pay-after-preview model).

## 8.1 Use Case (User)

**Use Case Name:** Print Document Using Piso Print System

**Primary Actor:** End User (Student, Customer, Library Patron)

**Stakeholders and Interests:**
- **User**: Wants quick, affordable printing without staff assistance
- **System Owner**: Wants reliable payment collection and service delivery
- **Administrator**: Wants minimal maintenance and clear transaction logs

**Preconditions:**
- System is powered on and operational
- Printer has paper and ink/toner
- User has Philippine peso coins (₱1, ₱5, ₱10, ₱20)
- User has digital document to print (via USB drive or device upload)

**Postconditions:**
- Document is printed successfully
- Payment is processed and logged
- Transaction is recorded in database
- User receives printed document
- Session automatically resets for next user

**Main Success Scenario:**

1. User approaches Piso Print kiosk
2. System displays Home screen with pricing information on LAFVIN 7 Inch Touchscreen IPS DSI Display:
   - Black & White: ₱2 per page
   - Grayscale: ₱3 per page
   - Color: ₱5 per page
3. System shows 3-step visual guide: Upload → Preview → Pay
4. User taps **"START PRINTING NOW"** button on touchscreen
5. System navigates to File Selection screen
6. System displays two file source options:
   - **Upload File** (from device via file picker)
   - **USB Drive** (auto-detected when inserted)
7. User selects preferred upload method
8. System validates and loads the selected file
9. System navigates to Print Preview screen
10. System displays document information (filename, page count, format)
11. User configures print settings:
    - Number of copies (1-100, default: 1)
    - Color mode (Color or Grayscale, default: Grayscale)
    - Double-sided printing (Yes/No, default: No)
    - Paper size: Letter 8.5" × 11" (fixed, not changeable)
12. System calculates total cost in real-time: `basePrice × pageCount × copies`
13. System displays calculated total cost on screen
14. User reviews settings and taps **"Continue"** button
15. System navigates to Payment screen
16. System displays required payment amount with progress bar at 0%
17. User inserts coins (₱1, ₱5, ₱10, or ₱20) into coin slot one at a time
18. System validates each coin via coin acceptor and ESP32
19. System updates progress bar and remaining amount in real-time after each coin
20. System plays coin acceptance animation for visual feedback
21. When total payment matches or exceeds required amount:
    - System displays "Payment Complete!" success message
    - System waits 2 seconds for user confirmation
22. System automatically navigates to Print Status screen
23. System submits print job to CUPS queue
24. System displays print progress (0-100%) with animated printer icon
25. System shows current page number (e.g., "Printing page 3 of 10")
26. Printer outputs pages to output tray
27. System displays "Print Complete!" message with success icon
28. System shows "Collect from output tray" reminder
29. User collects printed document from tray
30. System waits 2 seconds then automatically redirects to Home screen
31. System resets all state for next user
32. **Use case ends**

**Alternative Flows:**

**7a. Invalid Coin Inserted:**
1. User inserts coin during payment
2. Coin acceptor rejects coin (wrong size/weight/denomination)
3. Coin is returned via return slot
4. System does not update payment progress
5. System displays: "Invalid coin, please try again"
6. Resume from step 17 (user inserts valid coin)

**8a. File Upload Failed:**
1. Upload times out or fails (network issue, file too large)
2. System displays error message on touchscreen
3. User can tap "Retry" button or select different file
4. Resume from step 7 (user reselects upload method)

**8b. Unsupported File Format:**
1. User selects non-PDF file format
2. System validates file and detects incompatible format
3. System displays error: "Unsupported format. Please use PDF files only"
4. User must convert file to PDF format
5. Resume from step 7 (user reselects file)

**8c. USB Drive Not Detected:**
1. User selects "USB Drive" option
2. No USB device detected by system
3. System displays: "Please insert USB drive"
4. System waits for USB insertion (with timeout)
5. User inserts USB drive
6. System auto-detects and scans for files
7. Resume from step 8 (system loads file)

**15a. User Cancels During Payment:**
1. User is on Payment screen with partial payment (e.g., ₱5 of ₱10 paid)
2. User taps "Cancel" button
3. System displays confirmation dialog: "Cancel print job?"
4. User confirms cancellation
5. System returns to Print Preview screen (payment progress preserved for session)
6. Resume from step 14 (user can modify settings or continue)

**Session Timeout (Can occur at any step):**
1. User remains idle for configured timeout period (default: 5 minutes)
2. System detects no user activity (no touch, no coin insertion)
3. System displays "Session Timeout" overlay with countdown
4. After countdown expires (or immediately if configured):
   - System clears all selections and state
   - System cancels any pending operations
   - System returns any unused credits (if payment made but job not printed)
5. System automatically navigates to Home screen
6. Resume from step 1 (ready for next user)

**Frequency of Occurrence:** Multiple times per hour during peak usage (20-40 print jobs/day typical)

**Special Requirements:**
- Response time < 500ms for touchscreen interactions
- Payment progress updates in real-time (< 300ms after coin validation)
- File upload supports up to 50MB
- Print quality must be acceptable (300+ DPI for text readability)
- System must handle power interruptions gracefully (state persisted)
- Idle timeout prevents credit theft between users
- All user sessions isolated (no data leakage between users)
- Auto-reset ensures kiosk always ready for next user

## 8.2 Flowchart

### 8.2.1 Overall System Flowchart (Actual Implementation)

```
                    ┌─────────────────┐
                    │  START: User    │
                    │  Approaches     │
                    │  Kiosk          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Home Screen    │
                    │  Display:       │
                    │  • Pricing      │
                    │  • Instructions │
                    │  • START Button │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User Taps      │
                    │  "START         │
                    │  PRINTING NOW"  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  File Selection │
                    │  Screen         │
                    │  Show Options   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              Upload File         USB Drive
                    │                 │
                    ▼                 ▼
          ┌──────────────┐   ┌──────────────┐
          │  Open File   │   │  Detect USB  │
          │  Picker      │   │  Auto-scan   │
          └──────┬───────┘   └──────┬───────┘
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Validate File   │
                  │ (Format, Size)  │
                  └────────┬────────┘
                           │
                      ┌────┴────┐
                      │         │
                    Valid    Invalid
                      │         │
                      ▼         ▼
                ┌─────────┐ ┌────────┐
                │Continue │ │ Show   │
                │         │ │ Error  │
                └────┬────┘ └───┬────┘
                     │          │
                     │          └──────┐
                     │                 │
                     ▼                 │
          ┌──────────────────┐         │
          │ Print Preview    │         │
          │ Screen           │         │
          │ • Doc Info       │         │
          │ • Page Count     │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ User Configures  │         │
          │ Settings:        │         │
          │ • Copies         │         │
          │ • Color Mode     │         │
          │ • Double-sided   │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ Calculate Cost   │         │
          │ Real-time:       │         │
          │ Base × Pages ×   │         │
          │ Copies           │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ Display Total    │         │
          │ Cost on Screen   │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ User Taps        │         │
          │ "Continue"       │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ Payment Screen   │         │
          │ Show Required    │         │
          │ Amount           │         │
          │ Progress: 0%     │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ User Inserts     │         │
          │ Coins            │         │
          │ (₱1, ₱5, ₱10, ₱20)    │         │
          └────────┬─────────┘         │
                   │                   │
                   ▼                   │
          ┌──────────────────┐         │
          │ Coin Acceptor    │         │
          │ Validates        │         │
          └────────┬─────────┘         │
                   │                   │
              ┌────┴────┐              │
              │         │              │
          Valid      Invalid           │
              │         │              │
              ▼         ▼              │
        ┌─────────┐ ┌─────────┐       │
        │ Send to │ │ Reject  │       │
        │ ESP32   │ │ Coin    │       │
        └────┬────┘ └────┬────┘       │
             │           │             │
             ▼           └──────┐      │
        ┌─────────┐            │      │
        │ ESP32   │            │      │
        │ Counts  │            │      │
        │ Pulses  │            │      │
        └────┬────┘            │      │
             │                 │      │
             ▼                 │      │
        ┌─────────┐            │      │
        │ UART to │            │      │
        │ Pi      │            │      │
        └────┬────┘            │      │
             │                 │      │
             ▼                 │      │
        ┌─────────┐            │      │
        │ Update  │            │      │
        │ Progress│            │      │
        │ Bar     │            │      │
        └────┬────┘            │      │
             │                 │      │
             ▼                 │      │
        ┌─────────┐            │      │
        │ Update  │            │      │
        │ Remaining           │      │
        │ Amount  │            │      │
        └────┬────┘            │      │
             │                 │      │
             ▼                 │      │
        ┌─────────┐            │      │
        │ Payment │            │      │
        │Complete?│            │      │
        └────┬────┘            │      │
             │                 │      │
        ┌────┴────┐            │      │
        │         │            │      │
       YES       NO            │      │
        │         │            │      │
        │         └────────────┘      │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Show    │                        │
   │ Success │                        │
   │ (2 sec) │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Auto    │                        │
   │ Navigate│                        │
   │ to Print│                        │
   │ Status  │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Submit  │                        │
   │ Job to  │                        │
   │ CUPS    │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Show    │                        │
   │ Progress│                        │
   │ 0-100%  │                        │
   │ Page X  │                        │
   │ of Y    │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Monitor │                        │
   │ Print   │                        │
   │ Status  │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Printer │                        │
   │ Outputs │                        │
   │ Pages   │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Show    │                        │
   │ "Print  │                        │
   │Complete"│                        │
   │ (2 sec) │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Auto    │                        │
   │ Redirect│                        │
   │ to Home │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │ Reset   │                        │
   │ Session │                        │
   │ State   │                        │
   └────┬────┘                        │
        │                             │
        ▼                             │
   ┌─────────┐                        │
   │  END    │◄────────────────────────┘
   │ Ready   │  Cancel/Error Flow
   │ for Next│
   └─────────┘


┌─────────────────────────────────────────────────┐
│  SESSION TIMEOUT (Monitors All Steps)          │
│  Configuration: config/session.php (Laravel)    │
│  Default: 5 minutes idle timeout                │
│  ┌────────────────────────────────────────┐    │
│  │ Track User Activity:                   │    │
│  │ • Touch events                         │    │
│  │ • Coin insertions                      │    │
│  │ • Button clicks                        │    │
│  └──────────────┬─────────────────────────┘    │
│                 ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ Check Idle Time Every 5 Seconds        │    │
│  └──────────────┬─────────────────────────┘    │
│                 ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ Idle > Timeout (default 5 min)?        │    │
│  └──────────────┬─────────────────────────┘    │
│            ┌────┴────┐                          │
│           YES       NO                          │
│            │         │                          │
│            ▼         └─→ Continue               │
│  ┌──────────────┐                               │
│  │ Show Timeout │                               │
│  │ Overlay      │                               │
│  └──────┬───────┘                               │
│         ▼                                       │
│  ┌──────────────┐                               │
│  │ Reset to     │                               │
│  │ Home Screen  │                               │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
```

### 8.2.2 Payment Processing Flowchart (Actual Implementation)

*[Detailed payment flowchart with ESP32 pulse detection, UART communication, and UI updates - see original document for complete ASCII diagram]*

### 8.2.3 Print Job Processing Flowchart (Actual Implementation)

*[Detailed print job flowchart from file selection through CUPS submission - see original document for complete ASCII diagram]*

## 8.3 Key Implementation Insights

This section summarizes the important aspects of the actual implementation that differ from traditional coin-operated printing systems.

### 8.3.1 Flow Architecture Benefits

The implemented **Upload → Configure → Pay → Print** flow offers several advantages:

1. **Better User Experience**
   - Users know the exact cost before paying
   - No risk of paying too much or too little
   - Clear preview of what they're printing
   - Settings can be adjusted before commitment

2. **Reduced Errors**
   - File validation happens before payment
   - Unsupported files rejected early
   - Cost calculated accurately based on actual document

3. **Session Management**
   - Automatic idle timeout (5 minutes default)
   - Prevents credit theft between users
   - Clean state reset after each transaction
   - Activity tracking on all interactions

4. **Payment Flexibility**
   - Progressive payment (insert coins until sufficient)
   - Real-time visual feedback (progress bar)
   - Auto-proceed when complete (no manual confirmation)
   - Clear remaining amount display

### 8.3.2 State Management Architecture

The kiosk uses **Zustand** for state management with three main stores:

```typescript
// Application Store (appStore.ts)
- currentStep: NavigationStep          // Tracks current page
- lastActivity: Date                   // For idle timeout
- config: KioskConfig                  // System configuration
- isIdle: boolean                      // Idle state flag

// Print Store (printStore.ts)
- currentJob: PrintJob                 // Active print job
- printSettings: PrintSettings         // User-selected settings
- printerStatus: PrinterStatus         // Hardware status

// Payment Store (paymentStore.ts)
- coinPayment: CoinPayment             // Payment tracking
- totalAmount: number                  // Total paid
- transactions: Transaction[]          // Payment history
```

### 8.3.3 Navigation Flow

The navigation follows a strict linear progression:

```
navigationFlow: [
  'home',            // Step 0: Welcome screen
  'file-selection',  // Step 1: Choose upload method
  'print-preview',   // Step 2: Configure settings
  'payment',         // Step 3: Insert coins
  'print-status'     // Step 4: Monitor printing
]
```

**Navigation Methods:**
- `setCurrentStep(step)` - Jump to specific step
- `goToNextStep()` - Progress forward
- `goToPreviousStep()` - Go back
- Back buttons available on all screens except Home

### 8.3.4 Session Lifecycle

```
Session Start → Active Use → Completion/Timeout → Reset → Ready
     ↓              ↓              ↓                 ↓        ↓
  Home Screen   User Actions   Print Done      Clear State  Next User
                Track Activity  Auto-redirect   Reset Stores
                Update Timer    Wait 2 seconds  Return Home
```

**Timeout Mechanism:**
- Checks every 5 seconds
- Configurable timeout duration
- Tracks: touch, mouse, keyboard, coin insertion
- Shows overlay before reset
- Preserves system state (not user data)

### 8.3.5 Pricing Structure

Unlike the initially documented flat ₱1/page, the actual implementation uses **dynamic pricing by color mode**:

| Print Mode | Price per Page | Use Case |
|------------|----------------|----------|
| **Black & White** | ₱2.00 | Text documents, drafts |
| **Grayscale** | ₱3.00 | Documents with images |
| **Color** | ₱5.00 | Photos, presentations |

**Cost Calculation:**
```typescript
totalCost = basePrice × pageCount × copies

// Examples:
// 5-page B&W document, 1 copy = ₱2 × 5 × 1 = ₱10
// 10-page color document, 2 copies = ₱5 × 10 × 2 = ₱100
// 3-page grayscale report, 1 copy = ₱3 × 3 × 1 = ₱9
```

### 8.3.6 Auto-Progression Features

The system uses smart auto-progression to reduce user clicks:

1. **After Payment Complete**: 
   - Shows success (2 seconds)
   - Auto-navigates to Print Status
   - No "Continue" button needed

2. **After Print Complete**:
   - Shows completion (2 seconds)
   - Auto-redirects to Home
   - Resets all session state

3. **After Session Timeout**:
   - Shows timeout overlay
   - Auto-resets immediately
   - Returns to Home screen

This creates a **zero-click completion flow** after payment.

### 8.3.7 Error Handling Strategy

The implementation prioritizes **graceful degradation**:

```
Error Detection → User Notification → Action Options → Recovery

Examples:
• Invalid coin → Show message → Accept next coin → Continue
• File too large → Show limit → Select different file → Retry
• Printer jam → Show error → Notify admin → CUPS pauses job
• Session timeout → Show overlay → Reset system → Ready
```

**User-Facing Errors:**
- Clear, non-technical language
- Suggested actions provided
- Cancel/Retry options available
- Support contact shown if needed

### 8.3.8 Testing & Development Features

The kiosk includes **keyboard simulation** for testing without hardware:

```typescript
// Payment screen keyboard simulation (Development only)
// File: resources/js/pages/payment.tsx

import { useEffect } from 'react';

export default function PaymentScreen() {
  // Simulate coin insertion via keyboard (dev mode only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const handleKeyPress = (e: KeyboardEvent) => {
        switch(e.key) {
          case '1':
            simulateCoinInsert(1);  // ₱1 coin
            break;
          case '5':
            simulateCoinInsert(5);  // ₱5 coin
            break;
          case '0':
            simulateCoinInsert(10); // ₱10 coin (0 key)
            break;
          case '2':
            if (e.shiftKey) {
              simulateCoinInsert(20); // ₱20 coin (Shift+2 = @)
            }
            break;
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);
  
  const simulateCoinInsert = (amount: number) => {
    console.log(`[DEV] Simulating ₱${amount} coin insertion`);
    // Trigger same flow as real coin insertion
    router.post('/api/simulate-coin', { amount });
  };
  
  // ... rest of component
}
```

**Keyboard Shortcuts (Development Mode):**
- Press `1` → Simulate ₱1 coin
- Press `5` → Simulate ₱5 coin
- Press `0` → Simulate ₱10 coin
- Press `Shift+2` → Simulate ₱20 coin

This allows full flow testing on development machines without coin acceptor hardware.

---

**Navigation:**
- [← Previous: User Guide](07_user_guide.md)
- [→ Next: Testing & Validation](09_testing_validation.md)
- [↑ Back to Index](README.md)

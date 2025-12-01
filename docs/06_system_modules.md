# 6. System Modules

The Piso Print System is composed of five main modules that work together to provide complete functionality.

## 6.1 Coin Module (ESP32)

**Purpose:** Detects coin insertion via pulse input from ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor (a universal programmable coin acceptor that can accept various coin types)

**Functionality:**
- Universal coin acceptance: Can be programmed to accept up to 6 different coin types (A1-A6)
- Detects pulse signals on GPIO 25 (₱1: 1 pulse, ₱5: 5 pulses, ₱10: 10 pulses, ₱20: 20 pulses - programmable)
- Applies debouncing (30ms threshold) to prevent false detections
- Counts pulses over 500ms window (timeout)
- Calculates credit amount based on pulse count
- Formats JSON message with credit data
- Sends to Raspberry Pi via UART Serial (GPIO 17 TX → Pi GPIO 15 RX, 115200 baud)

**Coin Acceptor Programming:**
- Press + and - buttons simultaneously for 3 seconds to enter setup mode
- Set number of coin types (E parameter) - up to 6 types (A1-A6)
- Configure samples per coin (H parameters)
- Set pulse values (P parameters: ₱1=1, ₱5=5, ₱10=10, ₱20=20 pulses - programmable)
- Set sensitivity (F parameter: 8 standard)
- Insert sample coins for calibration (A1-A6 sequence)

**Communication Protocol:**
```json
{
  "type": "credit_update",
  "device_id": "ESP32_001",
  "amount": 5.00,
  "timestamp": 1697200000
}
```

**Hardware Connections:**
- **Coin Acceptor**: Connected to GPIO pin 25 for pulse detection (COIN signal)
- **Raspberry Pi**: Serial UART (GPIO 17 TX to Pi GPIO 15 RX, GPIO 16 RX to Pi GPIO 14 TX)
- **Power**: 5V from 12V to 5V DC-DC converter

**Key Functions:**

1. **Pulse Detection:**
```cpp
void IRAM_ATTR coinPulseISR() {
    unsigned long currentTime = millis();
    if (currentTime - lastPulseTime > DEBOUNCE_TIME) {
        pulseCount++;
        lastPulseTime = currentTime;
    }
}
```

2. **Credit Calculation:**
```cpp
void processCoins() {
    // Check if we have pulses and timeout occurred
    if (pulseCount > 0 && (millis() - lastPulseTime > 500)) {
        float creditAdded = 0.0;
        
        // Determine coin value based on pulse count (programmable)
        if (pulseCount == 1) creditAdded = 1.0;       // ₱1 coin (1 pulse)
        else if (pulseCount == 5) creditAdded = 5.0;  // ₱5 coin (5 pulses)
        else if (pulseCount == 10) creditAdded = 10.0; // ₱10 coin (10 pulses)
        else if (pulseCount == 20) creditAdded = 20.0; // ₱20 coin (20 pulses)
        
        if (creditAdded > 0) {
            totalCredits += creditAdded;
            sendCreditUpdate(creditAdded);  // Send to Pi via Serial UART
        }
        
        pulseCount = 0;
    }
}
```

3. **Serial Communication to Raspberry Pi:**
```cpp
void sendCreditUpdate(float amount) {
    StaticJsonDocument<200> doc;
    doc["type"] = "credit_update";
    doc["amount"] = amount;
    doc["balance"] = totalCredits;
    doc["timestamp"] = millis();
    
    serializeJson(doc, Serial2);  // Send via UART
    Serial2.println();
}
```

**Communication Protocol:**

**Serial UART (Production Configuration)**
- **Baud Rate:** 115200
- **Format:** 8N1 (8 data bits, no parity, 1 stop bit)
- **Wiring:** 
  - ESP32 GPIO 17 (TX) → Raspberry Pi GPIO 15 (RX)
  - ESP32 GPIO 16 (RX) → Raspberry Pi GPIO 14 (TX)
  - Common Ground (GND)
- **Message Format:** JSON (newline-terminated)
```json
{"type":"credit_update","device_id":"ESP32_001","amount":1.00,"total_balance":5.00,"timestamp":1234567890}
```

**Why Serial UART:**
- ✅ **Reliable:** Wired connection eliminates wireless interference
- ✅ **Low Latency:** < 10ms for credit updates (critical for payment transactions)
- ✅ **Simple Setup:** No network configuration required
- ✅ **Easy Debugging:** Direct monitoring via serial console
- ✅ **No Dependencies:** Works without WiFi/network services
- ✅ **Secure:** No network exposure for payment data

**Error Handling:**
- Pulse debouncing (ignore pulses < 30ms apart)
- Communication retry (3 attempts with exponential backoff)
- Serial monitor error logging
- Heartbeat monitoring
- Watchdog timer reset

## 6.2 Communication Module

**Purpose:** ESP32 ↔ Pi communication using UART Serial

**Protocol:** UART (115200 baud, 8N1)

**Wiring:**
- ESP32 GPIO 17 (TX) → Raspberry Pi GPIO 15 (RX)
- ESP32 GPIO 16 (RX) → Raspberry Pi GPIO 14 (TX)
- Common Ground (GND)

**Why UART Serial:**
- Reliable wired connection (no wireless interference)
- Low latency (< 10ms for credit updates)
- Simple setup (no network configuration)
- Easy debugging (serial monitor)
- Secure (no network exposure for payment data)

**Message Types:**

1. **Credit Update** (ESP32 → Pi):
```json
{
    "type": "credit_update",
    "device_id": "ESP32_001",
    "amount": 1.00,
    "total_balance": 5.00,
    "timestamp": 1696598400,
    "coin_count": 5
}
```

2. **Balance Request** (Pi → ESP32):
```json
{
    "type": "balance_request",
    "request_id": "req_12345"
}
```

3. **Balance Response** (ESP32 → Pi):
```json
{
    "type": "balance_response",
    "request_id": "req_12345",
    "balance": 5.00,
    "last_update": 1696598400
}
```

4. **System Status** (ESP32 → Pi):
```json
{
    "type": "status",
    "device_id": "ESP32_001",
    "uptime": 3600,
    "free_memory": 245000,
    "wifi_strength": -45,
    "last_coin": 1696598400
}
```

**Reliability Features:**
- Message acknowledgment
- Sequence numbers
- CRC checksums
- Automatic reconnection
- Message queuing during disconnection
- Duplicate detection

## 6.3 Print Manager (Laravel)

**Purpose:** Manages print jobs and CUPS integration

**Functionality:**
- **No job holding**: Jobs only created after payment complete
- **Payment tracking**: Per-job model (no persistent balances)
- Uses CUPS commands via Laravel Process facade:
  - `Process::run('lp -d printer file.pdf')` - Submit job to printer
  - `Process::run('lpstat -o')` - Monitor job status
  - `Process::run('cancel job-id')` - Cancel job (admin only)
- Real-time status monitoring (2-second polling via `jobs:monitor` Artisan command - see code below)
- Automatic error handling (paper jam, out of paper, printer offline)

**Why Laravel Process Facade:**
- ✅ Built into Laravel 12+ (requires Laravel 12.0 or higher)
- ✅ Excellent error handling with ProcessResult
- ✅ Easy to test (Process::fake() for unit tests)
- ✅ Works on both development and production
- ✅ Timeout and async execution support

**Key Components:**

1. **Credit Manager:**
```php
// app/Services/CreditManager.php
class CreditManager
{
    public function addCredits(int $userId, float $amount): void
    {
        $user = User::find($userId);
        $currentBalance = $user->balance;
        $user->increment('balance', $amount);
        
        Transaction::create([
            'user_id' => $userId,
            'transaction_type' => 'coin_insert',
            'amount' => $amount,
            'balance_before' => $currentBalance,
            'balance_after' => $currentBalance + $amount,
        ]);
    }
    
    public function checkBalance(int $userId, float $required): bool
    {
        $user = User::find($userId);
        return $user->balance >= $required;
    }
    
    public function deductCredits(int $userId, float $amount): bool
    {
        $user = User::find($userId);
        
        if ($user->balance >= $amount) {
            $currentBalance = $user->balance;
            $user->decrement('balance', $amount);
            
            Transaction::create([
                'user_id' => $userId,
                'transaction_type' => 'print_deduct',
                'amount' => -$amount,
                'balance_before' => $currentBalance,
                'balance_after' => $currentBalance - $amount,
            ]);
            
            return true;
        }
        
        return false;
    }
}
```

2. **Print Job Manager:**
```php
// app/Services/PrintJobManager.php
use App\Models\PrintJob;
use Illuminate\Support\Facades\Process;

class PrintJobManager
{
    public function __construct(
        protected CUPSManager $cups
    ) {}
    
    /**
     * Per-job payment model: Jobs only created AFTER payment complete.
     * No holding or queuing at application level.
     */
    public function submitJob(int $userId, string $filePath, int $pages, bool $paymentComplete = true): PrintJob
    {
        if (!$paymentComplete) {
            throw new \Exception("Cannot submit job without complete payment");
        }
        
        // Create job record
        $job = PrintJob::create([
            'user_id' => $userId,
            'file_path' => $filePath,
            'pages' => $pages,
            'status' => 'submitting',
            'created_at' => now(),
        ]);
        
        try {
            // Submit immediately to CUPS (no queue holding)
            $printerName = config('printing.default_printer');
            
            $cupsJobId = $this->cups->submitPrint(
                printer: $printerName,
                filePath: $filePath,
                options: [
                    'media' => 'Letter',
                    'fit-to-page' => 'true',
                ]
            );
            
            // Track active job
            $job->update([
                'cups_job_id' => $cupsJobId,
                'status' => 'printing',
                'started_at' => now(),
            ]);
            
        } catch (\Exception $e) {
            $job->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        }
        
        return $job;
    }
    
    public function getJobStatus(PrintJob $job): string
    {
        if (empty($job->cups_job_id)) {
            return $job->status;
        }
        
        return $this->cups->getJobStatus($job->cups_job_id);
    }
    
    public function cancelJob(PrintJob $job): void
    {
        if ($job->cups_job_id) {
            $this->cups->cancelJob($job->cups_job_id);
        }
        
        $job->update(['status' => 'cancelled']);
    }
}
```

3. **CUPS Integration:**
```php
// app/Services/CUPSManager.php
use Illuminate\Support\Facades\Process;

class CUPSManager
{
    public function submitPrint(string $printer, string $filePath, array $options = []): string
    {
        $optionsStr = $this->buildOptionsString($options);
        
        $result = Process::run("lp -d {$printer} {$optionsStr} {$filePath}");
        
        if ($result->failed()) {
            throw new \Exception('Print job failed: ' . $result->errorOutput());
        }
        
        // Extract job ID from output (e.g., "request id is printer-123")
        preg_match('/request id is [\w-]+-(\d+)/', $result->output(), $matches);
        return $matches[1] ?? '';
    }
    
    public function getJobStatus(string $jobId): string
    {
        $result = Process::run("lpstat -o | grep {$jobId}");
        
        if ($result->output() === '') {
            return 'completed';
        }
        
        if (str_contains($result->output(), 'processing')) {
            return 'processing';
        }
        
        return 'pending';
    }
    
    public function cancelJob(string $jobId): void
    {
        $result = Process::run("cancel {$jobId}");
        
        if ($result->failed()) {
            throw new \Exception('Failed to cancel job: ' . $result->errorOutput());
        }
    }
    
    public function listPrinters(): array
    {
        $result = Process::run('lpstat -p -d');
        
        if ($result->failed()) {
            return [];
        }
        
        return $this->parsePrinters($result->output());
    }
    
    public function getPrinterStatus(string $printer): array
    {
        $result = Process::run("lpstat -p {$printer} -l");
        
        return [
            'online' => str_contains($result->output(), 'enabled'),
            'accepting' => str_contains($result->output(), 'accepting'),
            'status' => $result->output(),
        ];
    }
    
    public function holdPrinter(string $printer): void
    {
        // Prevent new jobs from printing
        Process::run("cupsdisable {$printer}");
    }
    
    public function releasePrinter(string $printer): void
    {
        // Allow jobs to print
        Process::run("cupsenable {$printer}");
    }
    
    protected function buildOptionsString(array $options): string
    {
        $parts = [];
        foreach ($options as $key => $value) {
            $parts[] = "-o {$key}={$value}";
        }
        return implode(' ', $parts);
    }
    
    protected function parsePrinters(string $output): array
    {
        $printers = [];
        $lines = explode("\n", $output);
        
        foreach ($lines as $line) {
            if (preg_match('/printer (\S+)/', $line, $matches)) {
                $printers[] = [
                    'name' => $matches[1],
                    'enabled' => str_contains($line, 'enabled'),
                ];
            }
        }
        
        return $printers;
    }
}
```

**Workflow Integration:**
```php
// app/Services/PaymentService.php
namespace App\Services;

use App\Models\User;
use App\Services\CreditManager;

class PaymentService
{
    public function __construct(
        protected CreditManager $creditManager
    ) {}
    
    /**
     * Process coin insertion from ESP32 via UART
     * Per-job payment model: No job holding or queuing.
     * Jobs are only created and submitted to CUPS after full payment received.
     */
    public function processCoinInsertion(int $userId, float $amount): void
    {
        // Update payment progress
        $this->creditManager->addCredits($userId, $amount);
        
        // Check if payment complete
        if ($this->checkPaymentComplete($userId)) {
            // Submit job immediately to CUPS (no queue holding)
            $this->submitToCups($userId);
            $this->resetSession($userId);
        }
    }
    
    protected function checkPaymentComplete(int $userId): bool
    {
        $user = User::find($userId);
        $requiredAmount = session("required_amount_{$userId}", 0);
        
        return $user->balance >= $requiredAmount;
    }
    
    protected function submitToCups(int $userId): void
    {
        // Delegate to PrintJobManager
        app(PrintJobManager::class)->submitJob($userId);
    }
    
    protected function resetSession(int $userId): void
    {
        session()->forget("required_amount_{$userId}");
    }
}
```

**Job Status Monitoring:**
```php
// app/Console/Commands/MonitorPrintJobs.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PrintJob;
use App\Services\CUPSManager;
use App\Services\CreditManager;

class MonitorPrintJobs extends Command
{
    protected $signature = 'jobs:monitor';
    protected $description = 'Monitor active print jobs and update status';

    public function handle(CUPSManager $cupsManager, CreditManager $creditManager): void
    {
        $this->info('Starting print job monitor...');
        
        while (true) {
            $activeJobs = PrintJob::whereIn('status', ['pending', 'printing'])->get();
            
            foreach ($activeJobs as $job) {
                try {
                    $status = $cupsManager->getJobStatus($job->cups_job_id);
                    
                    if ($status === 'completed') {
                        // Job finished successfully
                        $job->update([
                            'status' => 'completed',
                            'completed_at' => now(),
                        ]);
                        
                        $this->info("Job {$job->id} completed successfully");
                        
                    } elseif ($status === 'aborted' || $status === 'cancelled') {
                        // Job failed - refund credits
                        $job->update(['status' => 'failed']);
                        
                        $creditManager->addCredits(
                            $job->user_id,
                            $job->cost
                        );
                        
                        $this->warn("Job {$job->id} failed - credits refunded");
                    }
                } catch (\Exception $e) {
                    $this->error("Error monitoring job {$job->id}: " . $e->getMessage());
                }
            }
            
            sleep(2); // Check every 2 seconds
        }
    }
}
```

## 6.4 Web UI Module

Provides the user interface for file uploads and system interaction.

**Technology Stack:**
- Frontend: Laravel 12 + Inertia.js 2.0.10 + React 19.2.0 + TypeScript 5.7.2
- Styling: Tailwind CSS 4.0.0 + Radix UI components
- State Management: Inertia.js page props + React hooks
- Build Tool: Vite 7.0.4
- Routing: Laravel Wayfinder (type-safe routing)

**Key Pages:**

1. **Home Page** (`resources/js/pages/home.tsx`):
   - Welcome message
   - Current balance display
   - Quick start instructions
   - System status

2. **File Upload Page** (`resources/js/pages/file-selection.tsx`):
   - Drag-and-drop file upload
   - File format validation
   - Multiple file selection
   - Upload progress bar
   - File preview

3. **Payment Page** (`resources/js/pages/payment.tsx`):
   - Credit balance display
   - Required credits calculation
   - Insert coin prompt
   - Real-time balance updates

4. **Print Preview Page** (`resources/js/pages/print-preview.tsx`):
   - Document preview
   - Page count display
   - Print settings (orientation, copies, etc.)
   - Cost breakdown
   - Confirm/Cancel buttons

5. **Print Status Page** (`resources/js/pages/print-status.tsx`):
   - Current job status
   - Print progress indicator
   - Estimated completion time
   - Cancel job option (while printing)

**API Routes:**

```php
// routes/web.php
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// File upload
Route::post('/upload', [FileUploadController::class, 'upload'])
    ->name('upload.file');

// Check payment status
Route::get('/payment/{sessionId}', [PaymentController::class, 'status'])
    ->name('payment.status');

// Get job status
Route::get('/jobs/{jobId}', [PrintJobController::class, 'status'])
    ->name('job.status');

// Cancel job
Route::delete('/jobs/{jobId}', [PrintJobController::class, 'cancel'])
    ->name('job.cancel');

// Get print history
Route::get('/history/{userId}', [PrintJobController::class, 'history'])
    ->name('job.history');
```

**Inertia.js Page Components:**

```typescript
// resources/js/pages/file-selection.tsx
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FileSelection() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const handleUpload = () => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        
        router.post('/upload', formData, {
            onSuccess: (page) => {
                // Inertia automatically handles navigation
                setUploading(false);
            },
            onError: (errors) => {
                console.error('Upload failed:', errors);
                setUploading(false);
            },
        });
    };
    
    return (
        <>
            <Head title="Upload File" />
            <div className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Select File to Print</h1>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="mb-4"
                    />
                    
                    {file && (
                        <div className="mt-4">
                            <p>Selected: {file.name}</p>
                            <Button 
                                onClick={handleUpload} 
                                disabled={uploading}
                                className="mt-4"
                            >
                                {uploading ? 'Uploading...' : 'Continue'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
```

**Real-time Updates:**
- Server-sent events (SSE) for live balance updates
- Polling for job status (2-second intervals)
- Inertia.js automatic page updates
- Laravel broadcasting for real-time events (optional)

**Example: Payment Status Updates**

```php
// app/Http/Controllers/PaymentController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function status(string $sessionId)
    {
        $userId = session("user_id_{$sessionId}");
        $user = User::find($userId);
        $required = session("required_amount_{$sessionId}", 0);
        
        return response()->json([
            'balance' => $user->balance,
            'required' => $required,
            'payment_complete' => $user->balance >= $required,
        ]);
    }
}
```

## 6.5 Admin Panel

Administrative interface for system management and monitoring.

**Technology Stack:**
- **Framework:** Laravel 12 + Inertia.js + React 19 + TypeScript 5.7.2
- **UI Components:** Radix UI (shared with kiosk UI)
- **Styling:** Tailwind CSS 4.0.0
- **State Management:** Inertia.js page props + React hooks
- **Routing:** Laravel Wayfinder (type-safe routing)
- **Charts:** Can integrate Recharts or similar
- **Tables:** Can integrate TanStack Table
- **Deployment:** Part of main Laravel application

**Key Benefits:**
- **Code Reusability:** Shares components, types, and utilities with kiosk UI
- **Consistency:** Same development patterns and tools as kiosk
- **Integrated:** No separate deployment needed
- **Fast:** Vite's optimized build and hot module replacement
- **Secure:** Laravel Fortify authentication built-in

**Access Control:**
- Login required (Laravel Fortify authentication)
- Session-based authentication
- Protected routes via auth middleware
- Password hashing (bcrypt)
- Two-factor authentication support

**Dashboard Sections:**

1. **Overview:**
   - Total revenue today/week/month
   - Total pages printed
   - Active users
   - Current queue length
   - System health status

2. **Print Queue Management:**
   - View all pending/active jobs
   - Cancel jobs
   - Change job priority
   - Hold/release printer
   - Print test page

3. **Revenue Reports:**
   - Daily/weekly/monthly revenue
   - Coins collected
   - Pages printed breakdown
   - Export to CSV/PDF

4. **System Configuration:**
   - Price per page
   - File size limits
   - PDF format validation settings
   - Maintenance mode toggle

5. **User Management:**
   - View registered users
   - Check balances
   - Add/deduct credits manually
   - View user print history

6. **Logs & Diagnostics:**
   - System logs viewer
   - Error logs
   - Transaction history
   - ESP32 connection status
   - Printer status
   - Database backup/restore

**Admin Routes:**

```php
// routes/web.php
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ConfigController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('admin.dashboard');
    
    // Reports
    Route::get('/reports', [ReportController::class, 'index'])
        ->name('admin.reports');
    Route::get('/reports/export', [ReportController::class, 'export'])
        ->name('admin.reports.export');
    
    // Configuration
    Route::get('/config', [ConfigController::class, 'index'])
        ->name('admin.config');
    Route::put('/config', [ConfigController::class, 'update'])
        ->name('admin.config.update');
    
    // Manual credit adjustment
    Route::post('/credits/adjust', [ConfigController::class, 'adjustCredits'])
        ->name('admin.credits.adjust');
    
    // System maintenance
    Route::post('/maintenance', [ConfigController::class, 'toggleMaintenance'])
        ->name('admin.maintenance.toggle');
});
```

**Admin Panel Integration:**

The admin panel is part of the same Laravel application, just protected routes:

```php
// routes/web.php
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('admin.dashboard');
});
```

No separate deployment needed - it's all one Laravel application!

## 6.6 Shared Components & Code Reusability

The Kiosk UI and Admin Dashboard share the same Laravel + Inertia + React codebase, enabling maximum code reuse.

**Shared Technology Stack:**
- Laravel 12.36.0 + Inertia.js 2.0.10
- React 19.2.0 + TypeScript 5.7.2
- Tailwind CSS 4.0.0
- Radix UI component primitives
- Lucide React 0.475.0 for icons
- Vite 7.0.4 for building

**Shared Components:**

```typescript
// resources/js/components/ui/
├── button.tsx              // ✅ Used in both kiosk and admin
├── card.tsx                // ✅ Used in both
├── dialog.tsx              // ✅ Used in both
├── dropdown-menu.tsx       // ✅ Used in both
├── input.tsx               // ✅ Used in both
├── label.tsx               // ✅ Used in both
├── select.tsx              // ✅ Used in both
├── table.tsx               // ✅ Used in admin
├── tabs.tsx                // ✅ Used in admin
├── progress.tsx            // ✅ Used in both
└── checkbox.tsx            // ✅ Used in both
```

**Shared TypeScript Types:**

```typescript
// resources/js/types/transaction.ts
export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: 'coin_insert' | 'print_deduct' | 'refund';
  balance_before: number;
  balance_after: number;
  print_job_id?: number;
  created_at: string;
  updated_at: string;
}

// resources/js/types/print-job.ts
export interface PrintJob {
  id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  pages: number;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
  cost: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// resources/js/types/payment.ts
export interface PaymentStatus {
  balance: number;
  required: number;
  payment_complete: boolean;
  remaining?: number;
}

// resources/js/types/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}
```

**Shared Utility Functions:**

```typescript
// resources/js/lib/formatters.ts
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toFixed(2)}`;
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

export const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// resources/js/lib/validators.ts
import { z } from 'zod';

export const printJobSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  pages: z.number().min(1, 'At least 1 page required'),
  copies: z.number().min(1).max(100, 'Max 100 copies'),
  colorMode: z.enum(['bw', 'grayscale', 'color']),
});

export type PrintJobFormData = z.infer<typeof printJobSchema>;
```

**Shared Constants:**

```typescript
// resources/js/lib/constants/pricing.ts
export const PRICE_PER_PAGE_BW = 2; // ₱2 per page (Black & White)
export const PRICE_PER_PAGE_GRAYSCALE = 3; // ₱3 per page (Grayscale)
export const PRICE_PER_PAGE_COLOR = 5; // ₱5 per page (Color)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = ['application/pdf'];
export const MAX_COPIES = 100;
export const MIN_COPIES = 1;

// resources/js/lib/constants/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
export const WIFI_SSID = 'PisoPrint_Kiosk';
export const WIFI_PASSWORD = 'PisoPrint2025';
export const WIFI_UPLOAD_URL = 'http://192.168.4.1';
**Implementation Strategy:**

Since this is a Laravel + Inertia.js monolith application, all code is in one repository:

```
piso-print/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── FileUploadController.php
│   │       ├── PrintJobController.php
│   │       ├── PaymentController.php
│   │       └── Admin/
│   │           ├── DashboardController.php
│   │           ├── ReportController.php
│   │           └── ConfigController.php
│   ├── Services/
│   │   ├── CreditManager.php
│   │   ├── CUPSManager.php
│   │   ├── PrintJobManager.php
│   │   └── PaymentService.php
│   └── Models/
│       ├── User.php
│       ├── PrintJob.php
│       └── Transaction.php
├── resources/
│   └── js/
│       ├── components/
│       │   └── ui/          # Shared UI components (Button, Dialog, etc.)
│       ├── pages/
│       │   ├── home.tsx     # Kiosk pages
│       │   ├── file-selection.tsx
│       │   ├── payment.tsx
│       │   └── admin/       # Admin pages
│       │       ├── dashboard.tsx
│       │       └── reports.tsx
│       ├── types/           # Shared TypeScript types
│       └── lib/
│           ├── utils.ts     # Shared utilities
│           └── constants/   # Shared constants
└── routes/
    └── web.php             # All routes in one file
```

No separate repositories or deployments needed - it's all one Laravel application!
```bash
# Copy shared components from frontend to admin
cp -r frontend/src/components/ui/* admin/src/components/ui/
cp -r frontend/src/lib/utils.ts admin/src/lib/

# Or use symlinks (not recommended for Windows)
ln -s ../../frontend/src/components/ui admin/src/components/ui
```

**Option 3: Git Submodules**

```bash
# Create shared repository
git submodule add https://github.com/user/pisoprint-shared shared

# Both frontend and admin import from ../shared
```

**Benefits of Code Sharing:**

1. **Consistency**: Same look and feel across kiosk and admin interfaces
2. **Maintainability**: Fix a bug once, it's fixed everywhere
3. **Development Speed**: Write component once, use it twice
4. **Type Safety**: Shared TypeScript types prevent API mismatches
5. **Reduced Bundle Size**: Same dependencies, better caching
6. **Easier Testing**: Test shared components once

**Example: Shared Button Component Usage**

```typescript
// resources/js/pages/home.tsx
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <Button variant="default" size="lg">
      Start Printing
    </Button>
  );
}

// resources/js/pages/admin/dashboard.tsx
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <Button variant="outline" size="sm">
      Export Report
    </Button>
  );
}
```

Both use the exact same Button component with identical styling and behavior!

---

**Navigation:**
- [← Previous: Database Design](05_database_design.md)
- [→ Next: User Guide](07_user_guide.md)
- [↑ Back to Index](README.md)

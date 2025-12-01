<?php

use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrintPreviewController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Home Route
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return redirect()->route('kiosk.home');
})->name('home');

/*
|--------------------------------------------------------------------------
| Health Check Endpoint (for Docker)
|--------------------------------------------------------------------------
*/
Route::get('/api/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'app' => config('app.name'),
        'env' => config('app.env'),
    ]);
})->name('health');

/*
|--------------------------------------------------------------------------
| Dashboard Redirect
|--------------------------------------------------------------------------
| Redirect /dashboard to admin dashboard for authenticated users
*/
Route::get('/dashboard', function () {
    return redirect()->route('admin.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Mobile Upload Portal (WiFi Access from Phone/Laptop)
|--------------------------------------------------------------------------
*/
Route::prefix('mobile')->name('mobile.')->group(function () {
    // Mobile-friendly upload page
    Route::get('/upload', function () {
        return Inertia::render('mobile/upload', [
            'maxFileSize' => config('printing.max_file_size', 50 * 1024 * 1024),
        ]);
    })->name('upload');

    // Handle mobile upload
    Route::post('/upload', [FileUploadController::class, 'mobileUpload'])->name('upload.store');
});

/*
|--------------------------------------------------------------------------
| Kiosk Routes (Public - No Authentication Required)
|--------------------------------------------------------------------------
*/
Route::prefix('kiosk')->name('kiosk.')->group(function () {
    // Home page
    Route::get('/', function () {
        return Inertia::render('kiosk/home', [
            'wifiInfo' => \App\Helpers\NetworkHelper::getWifiHotspotInfo(),
            'pendingUpload' => cache()->get('kiosk:pending_upload'),
        ]);
    })->name('home');

    // Reset kiosk state
    Route::get('/reset', function () {
        // Clear all kiosk-related session data
        session()->forget([
            'upload_info',
            'required_amount',
            'guest_user_id',
            'print_settings',
            'required_amount',
        ]);

        // Clear kiosk-related cache
        cache()->forget('kiosk:pending_upload');
        cache()->forget('kiosk:usb_detected');

        // Clear any temporary uploaded files
        $tempDir = storage_path('app/uploads/temp');
        if (is_dir($tempDir)) {
            $files = glob($tempDir.'/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }

        // Also clear old private temp files
        $oldTempDir = storage_path('app/private/uploads/temp');
        if (is_dir($oldTempDir)) {
            $files = glob($oldTempDir.'/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }

        return redirect()->route('kiosk.home')->with('success', 'Kiosk has been reset');
    })->name('reset');

    // File upload
    Route::get('/upload', [FileUploadController::class, 'index'])->name('upload');
    Route::post('/upload', [FileUploadController::class, 'upload'])->name('upload.store');

    // Print preview and settings
    Route::get('/preview', [PrintPreviewController::class, 'index'])->name('preview');

    // Cost calculation
    Route::post('/calculate-cost', [FileUploadController::class, 'calculateCost'])->name('calculate-cost');

    // PDF Preview - Serve temporary uploaded file
    Route::get('/preview-pdf/{filename}', [FileUploadController::class, 'servePreview'])
        ->name('preview-pdf')
        ->where('filename', '[a-fA-F0-9\-]+\.pdf');

    // Payment
    Route::get('/payment', [PaymentController::class, 'index'])->name('payment');
    Route::get('/payment/status', [PaymentController::class, 'status'])->name('payment.status');
    Route::post('/payment/coin', [PaymentController::class, 'processCoinInsertion'])->name('payment.coin');
    Route::post('/payment/cancel', [PaymentController::class, 'cancel'])->name('payment.cancel');

    // Print job
    Route::post('/print', [PrintJobController::class, 'submit'])->name('print.submit');
    Route::get('/print-status', [PrintJobController::class, 'index'])->name('print-status');
    Route::get('/print-status/{printJob}', [PrintJobController::class, 'status'])->name('print.status');
    Route::post('/print/{printJob}/cancel', [PrintJobController::class, 'cancel'])->name('print.cancel');

    // Print status preview (for design purposes)
    Route::get('/print-status-preview/{status?}', function (string $status = 'printing') {
        $validStatuses = ['pending', 'printing', 'completed', 'failed', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            $status = 'printing';
        }

        return Inertia::render('kiosk/print-status', [
            'printJob' => [
                'id' => 999,
                'fileName' => 'sample-document.pdf',
                'pages' => 5,
                'status' => $status,
                'currentPage' => $status === 'printing' ? 3 : ($status === 'completed' ? 5 : 0),
                'errorMessage' => $status === 'failed' ? 'Printer is out of paper. Please contact staff.' : null,
                'startedAt' => now()->subMinutes(2)->toIso8601String(),
                'completedAt' => $status === 'completed' ? now()->toIso8601String() : null,
                'colorMode' => 'grayscale',
                'copies' => 1,
            ],
        ]);
    })->name('print-status-preview');

    // Print history
    Route::get('/history', [PrintJobController::class, 'history'])->name('history');

    // WiFi Upload - Accept pending upload
    Route::post('/accept-pending-upload', [FileUploadController::class, 'acceptPendingUpload'])->name('accept-pending-upload');

    // USB Upload - API endpoints for usb-manager.sh script
    Route::post('/api/kiosk/usb/detected', [FileUploadController::class, 'usbDetected'])->name('api.usb.detected');
    Route::post('/api/kiosk/usb/file-ready', [FileUploadController::class, 'usbFileReady'])->name('api.usb.file-ready');

    // USB Status Polling - Frontend checks if USB was detected
    Route::get('/api/kiosk/usb/check-status', function () {
        $detected = cache()->has('kiosk:usb_detected');

        if ($detected) {
            $usbInfo = cache()->get('kiosk:usb_detected');
            // Clear cache after reading so frontend knows to check USB files
            cache()->forget('kiosk:usb_detected');
        }

        return response()->json([
            'detected' => $detected,
            'info' => $detected ? $usbInfo : null,
        ]);
    })->name('api.usb.check-status');

    // USB Upload from Inertia
    Route::post('/upload-from-usb', [FileUploadController::class, 'uploadFromUsb'])->name('uploadFromUsb');

    /*
    |--------------------------------------------------------------------------
    | Hardware Coin Listener Endpoint
    |--------------------------------------------------------------------------
    | This receives signals from the Python script and stores them in Cache
    | so the active user session (PaymentController) can claim them.
*/
    Route::post('/coin-deposit', function (Request $request) {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'machine_id' => 'required|string',
        ]);

        $amount = (float) $request->input('amount');

        // Add to the "Drop Box" (Cache)
        if (Cache::has('kiosk_pending_coins')) {
            Cache::increment('kiosk_pending_coins', $amount);
        } else {
            Cache::put('kiosk_pending_coins', $amount, 60); // Expires in 60s
        }

        return response()->json(['status' => 'received', 'amount' => $amount]);
    });
});

/*
|--------------------------------------------------------------------------
| Debug Routes (Development Only)
|--------------------------------------------------------------------------
*/
Route::get('/debug/cache/pending-upload', function () {
    return response()->json([
        'pending_upload' => cache()->get('kiosk:pending_upload'),
        'cache_driver' => config('cache.default'),
        'timestamp' => now()->toIso8601String(),
    ]);
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';

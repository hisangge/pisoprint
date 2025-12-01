<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PrintJobController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\TransactionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Administrative routes for managing the print kiosk system.
| All routes require authentication (no role-based access control).
|
*/

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Print Jobs Management
    Route::get('/print-jobs', [PrintJobController::class, 'index'])->name('print-jobs.index');
    Route::get('/print-jobs/export', [PrintJobController::class, 'export'])->name('print-jobs.export');
    Route::get('/print-jobs/{printJob}', [PrintJobController::class, 'show'])->name('print-jobs.show');

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/export', [TransactionController::class, 'export'])->name('transactions.export');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

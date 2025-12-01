<?php

namespace App\Http\Controllers;

use App\Services\PricingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PrintPreviewController extends Controller
{
    public function __construct(
        protected PricingService $pricingService
    ) {}

    /**
     * Display print preview page with settings.
     */
    public function index(): Response|RedirectResponse
    {
        $uploadInfo = session('upload_info');

        \Log::info('Print Preview Page Load', [
            'has_upload_info' => !empty($uploadInfo),
            'upload_info_keys' => $uploadInfo ? array_keys($uploadInfo) : null,
            'filename' => $uploadInfo['filename'] ?? 'N/A',
            'preview_url' => $uploadInfo['preview_url'] ?? 'N/A',
            'session_id' => session()->getId(),
        ]);

        if (! $uploadInfo) {
            \Log::warning('No upload_info in session, redirecting to upload');
            return redirect()->route('kiosk.upload')->with('error', 'No file uploaded');
        }

        // Check if the uploaded file still exists
        if (! file_exists($uploadInfo['path'])) {
            \Log::warning('Uploaded file not found, redirecting to upload', [
                'path' => $uploadInfo['path'],
                'filename' => $uploadInfo['filename'],
            ]);
            session()->forget('upload_info');
            return redirect()->route('kiosk.upload')->with('error', 'Uploaded file not found. Please upload again.');
        }

        return Inertia::render('kiosk/print-preview', [
            // Always include upload info - needed immediately
            'uploadInfo' => $uploadInfo,

            // Pricing information for display
            'pricingTable' => [
                'blackAndWhitePerPage' => config('printing.prices.black_and_white'),
                'grayscalePerPage' => config('printing.prices.grayscale'),
                'colorPerPage' => config('printing.prices.color'),
            ],

            // Available printers
            'availablePrinters' => [
                'default' => config('printing.default_printer_id'),
            ],
        ]);
    }
}

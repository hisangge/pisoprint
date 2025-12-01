<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictKioskAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $clientIp = $request->ip();
        $isLocalhost = in_array($clientIp, ['127.0.0.1', '::1', 'localhost']);

        // Define routes that are allowed from external devices (hotspot)
        $allowedExternalRoutes = [
            'mobile.upload',
            'mobile.upload.store',
            'health',
        ];

        // Define routes that are kiosk-only (not accessible from external devices)
        $kioskOnlyRoutes = [
            'kiosk.home',
            'kiosk.upload',
            'kiosk.upload.store',
            'kiosk.preview',
            'kiosk.calculate-cost',
            'kiosk.preview-pdf',
            'kiosk.payment',
            'kiosk.payment.status',
            'kiosk.payment.coin',
            'kiosk.payment.cancel',
            'kiosk.print.submit',
            'kiosk.print-status',
            'kiosk.print.status',
            'kiosk.print.cancel',
            'kiosk.history',
            'kiosk.accept-pending-upload',
            'kiosk.api.usb.detected',
            'kiosk.api.usb.file-ready',
            'kiosk.api.usb.files',
            'kiosk.upload-from-usb',
            // Admin routes - only accessible from kiosk/localhost
            'admin.dashboard',
            'admin.print-jobs.index',
            'admin.print-jobs.export',
            'admin.print-jobs.show',
            'admin.transactions.index',
            'admin.transactions.export',
            'admin.settings.index',
            'admin.settings.update',
            // User settings routes
            'profile.edit',
            'profile.update',
            'profile.destroy',
            'user-password.edit',
            'user-password.update',
            'appearance.edit',
            'two-factor.show',
        ];

        $currentRoute = $request->route()?->getName();

        // If accessing from external IP (hotspot)
        if (! $isLocalhost) {
            // Only allow specific routes
            if (! in_array($currentRoute, $allowedExternalRoutes)) {
                // Return a simple upload-only page for external access
                return response()->view('errors.external-access-only', [
                    'message' => 'This kiosk system is only accessible for file uploads from external devices. Please use the kiosk touchscreen for other functions.',
                    'uploadUrl' => route('mobile.upload'),
                ], 403);
            }
        }

        // If accessing kiosk-only routes from localhost, allow
        // If accessing allowed routes from anywhere, allow

        return $next($request);
    }
}

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

        // Define routes that are KIOSK-ONLY (only accessible from localhost/kiosk)
        // Everything else is accessible from external devices
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
            'kiosk.reset',
            'register', // Disable public registration - admin creates users manually
        ];

        $currentRoute = $request->route()?->getName();

        // If accessing from external IP and trying to access kiosk-only routes
        if (!$isLocalhost && in_array($currentRoute, $kioskOnlyRoutes)) {
            // Return a simple upload-only page for external access
            return response()->view('errors.external-access-only', [
                'message' => 'This kiosk system is only accessible for file uploads from external devices. Please use the kiosk touchscreen for other functions.',
                'uploadUrl' => route('mobile.upload'),
            ], 403);
        }

        return $next($request);
    }
}

<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RestrictKioskAccess;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RestrictKioskAccess::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            '/kiosk/api/kiosk/usb/detected', // Allow shell script to POST here
            '/kiosk/payment/coin',           // Allow Python coin listener
            'kiosk/coin-deposit',  // Allow the Python script
        ]);
    })
    
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle file upload size errors
        $exceptions->render(function (PostTooLargeException $e, $request) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return back()->with('error', 'The file you are trying to upload is too large. Maximum size is '.ini_get('upload_max_filesize').'B. Please try a smaller file or contact support.');
            }

            return response()->view('errors.413', [
                'message' => 'File too large. Maximum upload size is '.ini_get('upload_max_filesize').'B.',
            ], 413);
        });
    })->create();

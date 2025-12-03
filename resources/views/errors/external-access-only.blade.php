<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PisoPrint - Upload Access</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwindcss.config = {
            theme: {
                extend: {
                    colors: {
                        sky: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            200: '#bae6fd',
                            300: '#7dd3fc',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            800: '#075985',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        .float-animation {
            animation: float 3s ease-in-out infinite;
        }
    </style>
</head>
<body class="min-h-screen bg-white">
    <!-- Header -->
    <div class="border-b border-sky-100 bg-sky-50/30">
        <div class="mx-auto flex max-w-7xl items-center justify-center px-8 py-6">
            <div class="flex items-center gap-3">
                <svg class="h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <h1 class="text-2xl font-semibold text-sky-700">Piso Print</h1>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-lg px-8 py-16">
        <!-- Icon -->
        <div class="mb-8 text-center">
            <div class="float-animation mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                <svg class="h-12 w-12 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
        </div>

        <!-- Title -->
        <h2 class="mb-4 text-center text-3xl font-light text-sky-700">
            Mobile Upload
        </h2>
        <p class="mb-8 text-center text-lg text-sky-500">
            Upload files from your device
        </p>

        <!-- Info Card -->
        <div class="mb-8 rounded-lg border-2 border-sky-200 bg-white p-6 text-center shadow-sm">
            <div class="mb-4 flex items-center justify-center gap-2">
                <svg class="h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span class="text-sm font-medium text-sky-700">Connected via WiFi</span>
            </div>
            <p class="text-sky-600">
                Upload your PDF file here, then proceed to the kiosk touchscreen to select print options and insert coins.
            </p>
        </div>

        <!-- Button -->
        <a href="{{ $uploadUrl }}" 
           class="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-sky-400 to-sky-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-sky-200 transition-all hover:from-sky-500 hover:to-sky-600 hover:shadow-xl">
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload File
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        </a>

        <!-- Steps -->
        <div class="mt-12">
            <h3 class="mb-6 text-center text-xl font-light text-sky-700">How It Works</h3>
            <div class="space-y-4">
                <div class="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                        <span class="text-lg font-light text-sky-600">1</span>
                    </div>
                    <p class="text-sky-700">Upload your PDF file here</p>
                </div>
                <div class="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                        <span class="text-lg font-light text-sky-600">2</span>
                    </div>
                    <p class="text-sky-700">Go to kiosk and accept the file</p>
                </div>
                <div class="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                        <span class="text-lg font-light text-sky-600">3</span>
                    </div>
                    <p class="text-sky-700">Insert coins and print!</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="fixed bottom-0 left-0 right-0 border-t border-sky-100 bg-white/80 backdrop-blur-sm">
        <div class="mx-auto max-w-7xl px-8 py-4 text-center">
            <p class="text-sm text-sky-400">Piso Print Kiosk System</p>
        </div>
    </div>
</body>
</html>
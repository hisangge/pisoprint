<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use App\Services\CreditManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        protected CreditManager $creditManager
    ) {}

    /**
     * Check for hardware coins and add to balance.
     * This is the bridge between the Python script and the User.
     */
    private function processPendingCoins($userId)
    {
        if (!$userId) return;

        // check the "Drop Box" cache key used by web.php
        $pendingHardwareCoins = Cache::pull('kiosk_pending_coins', 0);

        if ($pendingHardwareCoins > 0) {
            // Log for debugging
            \Log::info("Claiming coin from cache: $pendingHardwareCoins for User: $userId");
            
            // FIXED: Removed the array in the 4th argument. Passed null instead.
            $this->creditManager->addCredits(
                $userId,
                $pendingHardwareCoins,
                "Coin Inserted (Hardware)",
                null // Job ID must be null
            );
        }
    }

    public function index(Request $request): Response
    {
        $userId = $request->user()?->id ?? session('guest_user_id');

        // Get required amount
        $requiredAmount = $request->input('required_amount') ?? session('required_amount', 0);
        $requiredAmount = (float) $requiredAmount;

        if ($request->has('required_amount')) {
            session(['required_amount' => $requiredAmount]);
        }

        $uploadInfo = session('upload_info', []);
        $sessionId = session()->getId();

        if (! $userId) {
            // Create guest user if missing
            $guestEmail = 'guest_'.substr($sessionId, 0, 16).'@pisoprint.local';
            $guestUser = User::firstOrCreate(
                ['email' => $guestEmail],
                [
                    'name' => 'Guest '.substr($sessionId, 0, 8),
                    'password' => bcrypt(Str::random(32)),
                    'balance' => 0,
                ]
            );

            $userId = $guestUser->id;
            session(['guest_user_id' => $userId]);
        }

        // Claim coins here because Inertia Poll hits this method
        $this->processPendingCoins($userId);

        $currentBalance = $this->creditManager->getBalance($userId);

        return Inertia::render('kiosk/payment', [
            'uploadInfo' => [
                'fileName' => $uploadInfo['original_name'] ?? 'Unknown',
                'pages' => $uploadInfo['pages'] ?? 0,
                'cost' => $requiredAmount,
            ],
            'paymentStatus' => [
                'amountPaid' => $currentBalance,
                'amountRequired' => $requiredAmount,
                'isComplete' => $requiredAmount > 0 && $currentBalance >= $requiredAmount,
                'sessionId' => $sessionId,
                'coinInsertions' => fn () => Transaction::query()
                    ->where('user_id', $userId)
                    ->where('session_id', $sessionId)
                    ->where('transaction_type', 'coin_insertion')
                    ->latest()
                    ->limit(10)
                    ->get(['amount', 'created_at'])
                    ->map(fn ($t) => [
                        'value' => $t->amount,
                        'timestamp' => $t->created_at->toIso8601String(),
                    ]),
            ],
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?? session('guest_user_id');
        $requiredAmount = session('required_amount', 0);
        $sessionId = session()->getId();

        // Check for coins here too
        $this->processPendingCoins($userId);

        if (! $userId) {
            return response()->json([
                'amountPaid' => 0,
                'amountRequired' => $requiredAmount,
                'coinInsertions' => [],
                'isComplete' => false,
                'sessionId' => $sessionId,
            ]);
        }

        $currentBalance = $this->creditManager->getBalance($userId);

        $coinInsertions = Transaction::query()
            ->where('user_id', $userId)
            ->where('session_id', $sessionId)
            ->where('transaction_type', 'coin_insertion')
            ->latest()
            ->limit(10)
            ->get(['amount', 'created_at'])
            ->map(fn ($t) => [
                'value' => $t->amount,
                'timestamp' => $t->created_at->toIso8601String(),
            ]);

        return response()->json([
            'amountPaid' => $currentBalance,
            'amountRequired' => $requiredAmount,
            'coinInsertions' => $coinInsertions,
            'isComplete' => $requiredAmount > 0 && $currentBalance >= $requiredAmount,
            'sessionId' => $sessionId,
        ]);
    }

    public function processCoinInsertion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0', 'max:100'],
            'coin_value' => ['nullable', 'numeric', 'in:1,5,10,20'],
            'esp32_id' => ['nullable', 'string', 'max:50'],
        ]);

        $userId = $request->user()?->id ?? session('guest_user_id');

        if (! $userId) {
            return $this->errorResponse('NO_ACTIVE_SESSION', 'No active session found.', 400);
        }

        $amount = $validated['amount'];
        $coinValue = $validated['coin_value'] ?? null;
        $esp32Id = $validated['esp32_id'] ?? null;

        $transaction = $this->creditManager->addCredits(
            $userId,
            $amount,
            "Coin inserted: ₱{$amount}",
            null
        );

        if ($esp32Id || $coinValue) {
            $transaction->update([
                'esp32_id' => $esp32Id,
                'coin_value' => $coinValue,
                'coin_count' => $coinValue ? 1 : null,
                'session_id' => session()->getId(),
            ]);
        }

        $currentBalance = $this->creditManager->getBalance($userId);
        $requiredAmount = session('required_amount', 0);

        return response()->json([
            'success' => true,
            'balance' => $currentBalance,
            'required' => $requiredAmount,
            'payment_complete' => $currentBalance >= $requiredAmount,
            'transaction_id' => $transaction->id,
        ]);
    }

    public function cancel(Request $request): RedirectResponse
    {
        $userId = $request->user()?->id ?? session('guest_user_id');

        if (! $userId) {
            return redirect()->route('kiosk.home');
        }

        $this->creditManager->resetSession($userId);
        session()->forget(['upload_info', 'required_amount', 'guest_user_id']);

        return redirect()->route('kiosk.home')->with('info', 'Payment cancelled');
    }

    protected function errorResponse(string $errorCode, string $message, int $statusCode = 400, array $additionalData = []): JsonResponse {
        return response()->json(array_merge([
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ], $additionalData), $statusCode);
    }
}
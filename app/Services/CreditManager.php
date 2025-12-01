<?php

namespace App\Services;

use App\Events\PaymentReceived;
use App\Exceptions\InsufficientBalanceException;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreditManager
{
    /**
     * Add credits to user's balance with transaction logging.
     *
     * This method performs an atomic balance update with full audit trail.
     * It creates a transaction record and dispatches a payment received event.
     *
     * @param  int  $userId  The user ID to credit
     * @param  float  $amount  The amount to add (must be positive)
     * @param  string  $description  Transaction description
     * @param  int|null  $jobId  Optional print job ID for reference
     * @param  float|null  $coinValue  The actual coin denomination inserted
     * @return Transaction The created transaction record
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If user not found
     */
    public function addCredits(
        int $userId,
        float $amount,
        string $description = 'Credit added',
        ?int $jobId = null,
        ?float $coinValue = null
    ): Transaction {
        return DB::transaction(function () use ($userId, $amount, $description, $jobId, $coinValue) {
            $user = User::lockForUpdate()->findOrFail($userId);

            $currentBalance = $user->balance;
            $user->increment('balance', $amount);

            $transaction = Transaction::create([
                'user_id' => $userId,
                'transaction_type' => 'coin_insert',
                'amount' => $amount,
                'balance_before' => $currentBalance,
                'balance_after' => $currentBalance + $amount,
                'print_job_id' => $jobId,
                'description' => $description,
            ]);

            // Dispatch payment received event
            PaymentReceived::dispatch($user, $transaction, $amount, $coinValue ?? $amount);

            return $transaction;
        });
    }

    /**
     * Check if user has sufficient balance.
     *
     * @param  int  $userId  The user ID
     * @param  float  $required  The required amount
     * @return bool True if user has sufficient balance
     */
    public function checkBalance(int $userId, float $required): bool
    {
        $user = User::find($userId);

        return $user && $user->balance >= $required;
    }

    /**
     * Check if user has sufficient balance (alias for checkBalance)
     */
    public function hasSufficientBalance(int $userId, float $required): bool
    {
        return $this->checkBalance($userId, $required);
    }

    /**
     * Deduct credits from user's balance with transaction logging.
     *
     * This method performs an atomic balance deduction with full audit trail.
     * It validates sufficient balance before deduction and creates a transaction record.
     *
     * @param  int  $userId  The user ID to debit
     * @param  float  $amount  The amount to deduct (must be positive)
     * @param  string  $description  Transaction description
     * @param  int|null  $jobId  Optional print job ID for reference
     * @return Transaction The created transaction record
     *
     * @throws InsufficientBalanceException If user has insufficient balance
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If user not found
     */
    public function deductCredits(
        int $userId,
        float $amount,
        string $description = 'Print job payment',
        ?int $jobId = null
    ): Transaction {
        return DB::transaction(function () use ($userId, $amount, $description, $jobId) {
            $user = User::lockForUpdate()->findOrFail($userId);

            if ($user->balance < $amount) {
                throw new InsufficientBalanceException($amount, $user->balance);
            }

            $currentBalance = $user->balance;
            $user->decrement('balance', $amount);

            return Transaction::create([
                'user_id' => $userId,
                'transaction_type' => 'print_deduction',
                'amount' => $amount,
                'balance_before' => $currentBalance,
                'balance_after' => $currentBalance - $amount,
                'print_job_id' => $jobId,
                'description' => $description,
            ]);
        });
    }

    /**
     * Get user's current balance.
     *
     * @param  int  $userId  The user ID
     * @return float The user's current balance
     */
    public function getBalance(int $userId): float
    {
        $user = User::find($userId);

        return $user ? $user->balance : 0.0;
    }

    /**
     * Get user's transaction history.
     *
     * @param  int  $userId  The user ID
     * @param  int  $limit  Maximum number of transactions to retrieve
     * @return \Illuminate\Support\Collection Collection of transactions
     */
    public function getTransactionHistory(int $userId, int $limit = 50): \Illuminate\Support\Collection
    {
        return Transaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Reset user's session balance (after job completion).
     *
     * @param  int  $userId  The user ID
     */
    public function resetSession(int $userId): void
    {
        $user = User::find($userId);

        if ($user) {
            $user->update(['balance' => 0]);
        }
    }
}

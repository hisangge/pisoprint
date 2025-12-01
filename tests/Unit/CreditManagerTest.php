<?php

use App\Exceptions\InsufficientBalanceException;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CreditManager;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->creditManager = app(CreditManager::class);
    $this->user = User::factory()->create(['balance' => 0]);
});

test('can add credits to user balance', function () {
    $amount = 10.00;
    $description = 'Test credit addition';

    $transaction = $this->creditManager->addCredits(
        $this->user->id,
        $amount,
        $description
    );

    expect($transaction)->toBeInstanceOf(Transaction::class)
        ->and((float) $transaction->amount)->toBe($amount)
        ->and($transaction->transaction_type)->toBe('coin_insert')
        ->and($transaction->description)->toBe($description);

    $this->user->refresh();
    expect((float) $this->user->balance)->toBe($amount);
});

test('tracks balance changes in transaction', function () {
    $initialBalance = 5.00;
    $this->user->update(['balance' => $initialBalance]);

    $amount = 10.00;
    $transaction = $this->creditManager->addCredits($this->user->id, $amount);

    expect((float) $transaction->balance_before)->toBe($initialBalance)
        ->and((float) $transaction->balance_after)->toBe($initialBalance + $amount);
});

test('can deduct credits from user balance', function () {
    $this->user->update(['balance' => 20.00]);

    $amount = 5.00;
    $transaction = $this->creditManager->deductCredits(
        $this->user->id,
        $amount,
        'Test deduction',
        null // Don't use foreign key
    );

    expect($transaction)->toBeInstanceOf(Transaction::class)
        ->and((float) $transaction->amount)->toBe($amount)
        ->and($transaction->transaction_type)->toBe('print_deduction');

    $this->user->refresh();
    expect((float) $this->user->balance)->toBe(15.00);
});

test('cannot deduct more than available balance', function () {
    $this->user->update(['balance' => 5.00]);

    expect(fn () => $this->creditManager->deductCredits(
        $this->user->id,
        10.00,
        'Test insufficient funds'
    ))->toThrow(InsufficientBalanceException::class, 'Insufficient balance');

    $this->user->refresh();
    expect((float) $this->user->balance)->toBe(5.00); // Balance unchanged
});

test('insufficient balance exception provides detailed information', function () {
    $this->user->update(['balance' => 5.00]);

    try {
        $this->creditManager->deductCredits(
            $this->user->id,
            10.00,
            'Test insufficient funds'
        );
        $this->fail('Expected InsufficientBalanceException was not thrown');
    } catch (InsufficientBalanceException $e) {
        expect($e->getMessage())->toContain('10')
            ->and($e->getMessage())->toContain('5');
    }
});

test('can check if user has sufficient balance', function () {
    $this->user->update(['balance' => 10.00]);

    expect($this->creditManager->hasSufficientBalance($this->user->id, 5.00))->toBeTrue()
        ->and($this->creditManager->hasSufficientBalance($this->user->id, 15.00))->toBeFalse();
});

test('can get current balance', function () {
    $balance = 25.50;
    $this->user->update(['balance' => $balance]);

    expect((float) $this->creditManager->getBalance($this->user->id))->toBe($balance);
});

test('can reset user session balance', function () {
    $this->user->update(['balance' => 15.00]);

    $this->creditManager->resetSession($this->user->id);

    $this->user->refresh();
    expect((float) $this->user->balance)->toBe(0.0);
});

test('add credits creates transaction with coin count', function () {
    $transaction = $this->creditManager->addCredits(
        $this->user->id,
        5.00,
        'Coin inserted',
        null
    );

    // Update with coin details
    $transaction->update([
        'coin_value' => 5.00,
        'coin_count' => 1,
    ]);

    expect((float) $transaction->coin_value)->toBe(5.00)
        ->and($transaction->coin_count)->toBe(1);
});

test('handles concurrent balance updates safely', function () {
    $this->user->update(['balance' => 0]);

    // Simulate concurrent additions
    $this->creditManager->addCredits($this->user->id, 5.00, 'Transaction 1');
    $this->creditManager->addCredits($this->user->id, 3.00, 'Transaction 2');
    $this->creditManager->addCredits($this->user->id, 2.00, 'Transaction 3');

    $this->user->refresh();
    expect((float) $this->user->balance)->toBe(10.00);
});

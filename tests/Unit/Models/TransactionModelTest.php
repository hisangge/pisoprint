<?php

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('transaction belongs to user relationship', function () {
    $user = User::factory()->create();
    $transaction = Transaction::factory()->create(['user_id' => $user->id]);

    expect($transaction->user)->toBeInstanceOf(User::class);
    expect($transaction->user->id)->toBe($user->id);
});

test('transaction can belong to print job', function () {
    $user = User::factory()->create();
    $printJob = PrintJob::factory()->create(['user_id' => $user->id]);

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'print_job_id' => $printJob->id,
    ]);

    expect($transaction->printJob)->toBeInstanceOf(PrintJob::class);
    expect($transaction->printJob->id)->toBe($printJob->id);
});

test('transaction stores amount correctly', function () {
    $transaction = Transaction::factory()->create(['amount' => 15.50]);

    expect((float) $transaction->amount)->toBe(15.50);
});

test('transaction records balance before and after', function () {
    $transaction = Transaction::factory()->create([
        'balance_before' => 20.00,
        'balance_after' => 30.00,
    ]);

    expect((float) $transaction->balance_before)->toBe(20.00);
    expect((float) $transaction->balance_after)->toBe(30.00);
});

test('transaction type is stored correctly', function () {
    $coinTransaction = Transaction::factory()->create(['transaction_type' => 'coin_insert']);
    $printTransaction = Transaction::factory()->create(['transaction_type' => 'print_deduction']);
    $refundTransaction = Transaction::factory()->create(['transaction_type' => 'refund']);

    expect($coinTransaction->transaction_type)->toBe('coin_insert');
    expect($printTransaction->transaction_type)->toBe('print_deduction');
    expect($refundTransaction->transaction_type)->toBe('refund');
});

test('transaction stores description', function () {
    $transaction = Transaction::factory()->create([
        'description' => 'Added credits from coin insertion',
    ]);

    expect($transaction->description)->toBe('Added credits from coin insertion');
});

test('transaction stores session id', function () {
    $sessionId = 'test-session-'.uniqid();
    $transaction = Transaction::factory()->create(['session_id' => $sessionId]);

    expect($transaction->session_id)->toBe($sessionId);
});

test('transaction can have nullable print job id', function () {
    $user = User::factory()->create();
    $printJob = PrintJob::factory()->create(['user_id' => $user->id]);

    $withPrintJob = Transaction::factory()->create([
        'user_id' => $user->id,
        'print_job_id' => $printJob->id,
    ]);
    $withoutPrintJob = Transaction::factory()->create([
        'user_id' => $user->id,
        'print_job_id' => null,
    ]);

    expect($withPrintJob->print_job_id)->toBe($printJob->id);
    expect($withoutPrintJob->print_job_id)->toBeNull();
});

test('transaction records created timestamp', function () {
    $transaction = Transaction::factory()->create();

    expect($transaction->created_at)->not->toBeNull();
});

test('transaction calculates balance change correctly', function () {
    $addCredits = Transaction::factory()->create([
        'balance_before' => 10.00,
        'balance_after' => 15.00,
    ]);

    $deductCredits = Transaction::factory()->create([
        'balance_before' => 15.00,
        'balance_after' => 5.00,
    ]);

    // Balance change calculation
    $addChange = (float) $addCredits->balance_after - (float) $addCredits->balance_before;
    $deductChange = (float) $deductCredits->balance_after - (float) $deductCredits->balance_before;

    expect($addChange)->toBe(5.00);
    expect($deductChange)->toBe(-10.00);
});

test('transaction amount matches balance change', function () {
    $transaction = Transaction::factory()->create([
        'amount' => 10.00,
        'balance_before' => 5.00,
        'balance_after' => 15.00,
    ]);

    $balanceChange = (float) $transaction->balance_after - (float) $transaction->balance_before;

    expect($balanceChange)->toBe((float) $transaction->amount);
});

test('multiple transactions for same user are ordered by created date', function () {
    $user = User::factory()->create();

    $transaction1 = Transaction::factory()->create([
        'user_id' => $user->id,
        'created_at' => now()->subMinutes(5),
    ]);

    $transaction2 = Transaction::factory()->create([
        'user_id' => $user->id,
        'created_at' => now()->subMinutes(3),
    ]);

    $transaction3 = Transaction::factory()->create([
        'user_id' => $user->id,
        'created_at' => now()->subMinutes(1),
    ]);

    $orderedTransactions = Transaction::where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->get();

    expect($orderedTransactions->first()->id)->toBe($transaction3->id);
    expect($orderedTransactions->last()->id)->toBe($transaction1->id);
});

test('transaction session id groups related transactions', function () {
    $user = User::factory()->create();
    $sessionId = 'session-'.uniqid();

    Transaction::factory()->count(3)->create([
        'user_id' => $user->id,
        'session_id' => $sessionId,
    ]);

    Transaction::factory()->count(2)->create([
        'user_id' => $user->id,
        'session_id' => 'other-session',
    ]);

    $sessionTransactions = Transaction::where('session_id', $sessionId)->get();

    expect($sessionTransactions)->toHaveCount(3);
});

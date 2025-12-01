<?php

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CreditManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('complete print workflow from upload to payment to print', function () {
    Storage::fake('local');

    // Step 1: Upload file
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $uploadResponse = $this->post('/kiosk/upload', [
        'file' => $file,
    ]);

    $uploadResponse->assertRedirect('/kiosk/preview');
    expect(session('upload_info'))->toBeArray();

    // Step 2: Calculate cost
    $costResponse = $this->postJson('/kiosk/calculate-cost', [
        'pages' => 5,
        'copies' => 1,
        'color_mode' => 'bw',
    ]);

    $costResponse->assertStatus(200);
    $cost = $costResponse->json('cost');
    expect($cost)->toBeGreaterThan(0);

    // Step 3: Go to payment page
    session(['required_amount' => $cost]);
    $paymentResponse = $this->get('/kiosk/payment');
    $paymentResponse->assertStatus(200);

    // Step 4: Insert coins until payment complete
    $user = User::factory()->create(['balance' => 0]);
    session(['guest_user_id' => $user->id]);

    $coinResponse1 = $this->postJson('/kiosk/payment/coin', [
        'amount' => 5.00,
        'coin_value' => 5.00,
    ]);
    $coinResponse1->assertJson(['success' => true]);

    if ($cost > 5.00) {
        $remainingAmount = $cost - 5.00;
        $coinResponse2 = $this->postJson('/kiosk/payment/coin', [
            'amount' => $remainingAmount,
            'coin_value' => $remainingAmount,
        ]);
        $coinResponse2->assertJson(['success' => true]);
    }

    // Step 5: Check payment status
    $statusResponse = $this->getJson('/kiosk/payment/status');
    $statusResponse->assertJson(['isComplete' => true]);

    // Verify transactions were created
    expect(Transaction::where('user_id', $user->id)->count())->toBeGreaterThan(0);

    // Verify final balance matches required amount
    $user->refresh();
    expect($user->balance)->toBeGreaterThanOrEqual($cost);
});

test('payment flow with insufficient funds and cancellation', function () {
    $user = User::factory()->create(['balance' => 0]);
    session([
        'guest_user_id' => $user->id,
        'required_amount' => 10.00,
    ]);

    // Insert partial payment with valid coin denomination
    $coinResponse = $this->postJson('/kiosk/payment/coin', [
        'amount' => 5.00,
        'coin_value' => 5.00,
    ]);

    $coinResponse->assertJson([
        'success' => true,
        'balance' => 5.00,
    ]);

    // Cancel payment
    $cancelResponse = $this->post('/kiosk/payment/cancel', [
        'sessionId' => session()->getId(),
    ]);

    $cancelResponse->assertRedirect('/kiosk');

    // Verify balance was reset
    $user->refresh();
    expect((float) $user->balance)->toBe(0.0);
});

test('credit deduction and print job creation flow', function () {
    $creditManager = app(CreditManager::class);
    $user = User::factory()->create(['balance' => 20.00]);

    $cost = 10.00;

    // Verify sufficient balance
    expect($creditManager->hasSufficientBalance($user->id, $cost))->toBeTrue();

    // Create a print job first
    $printJob = PrintJob::factory()->create([
        'user_id' => $user->id,
        'cost' => $cost,
    ]);

    // Deduct credits
    $transaction = $creditManager->deductCredits($user->id, $cost, 'Print job payment', $printJob->id);

    expect($transaction)->toBeInstanceOf(Transaction::class)
        ->and($transaction->transaction_type)->toBe('print_deduction')
        ->and((float) $transaction->amount)->toBe($cost);

    $user->refresh();
    expect((float) $user->balance)->toBe(10.00);

    // Verify transaction recorded correctly
    $printTransaction = Transaction::where('user_id', $user->id)
        ->where('transaction_type', 'print_deduction')
        ->first();

    expect($printTransaction)->not->toBeNull()
        ->and((float) $printTransaction->balance_before)->toBe(20.00)
        ->and((float) $printTransaction->balance_after)->toBe(10.00);
});

test('refund on print job failure', function () {
    $creditManager = app(CreditManager::class);
    $user = User::factory()->create(['balance' => 0]);

    // Add credits
    $creditManager->addCredits($user->id, 20.00, 'Initial balance');

    // Create print job
    $printJob = PrintJob::factory()->create([
        'user_id' => $user->id,
        'cost' => 10.00,
    ]);

    // Deduct for print job
    $cost = 10.00;
    $creditManager->deductCredits($user->id, $cost, 'Print job payment', $printJob->id);

    $user->refresh();
    expect((float) $user->balance)->toBe(10.00);

    // Simulate job failure and refund
    $creditManager->addCredits($user->id, $cost, 'Refund - Print job failed', $printJob->id);

    $user->refresh();
    expect((float) $user->balance)->toBe(20.00);

    // Verify refund transaction
    $refundTransaction = Transaction::where('user_id', $user->id)
        ->where('description', 'like', '%Refund%')
        ->first();

    expect($refundTransaction)->not->toBeNull();
});

test('multiple concurrent payments are handled correctly', function () {
    $user = User::factory()->create(['balance' => 0]);
    session(['guest_user_id' => $user->id]);

    // Simulate rapid coin insertions
    $coins = [1.00, 5.00, 1.00, 5.00, 1.00];

    foreach ($coins as $coin) {
        $response = $this->postJson('/kiosk/payment/coin', [
            'amount' => $coin,
            'coin_value' => $coin,
        ]);

        $response->assertJson(['success' => true]);
    }

    $user->refresh();
    expect((float) $user->balance)->toBe(array_sum($coins));

    // Verify all transactions recorded
    $transactions = Transaction::where('user_id', $user->id)->get();
    expect($transactions->count())->toBe(count($coins));
});

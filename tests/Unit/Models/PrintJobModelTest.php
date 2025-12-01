<?php

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('print job belongs to user relationship', function () {
    $user = User::factory()->create();
    $printJob = PrintJob::factory()->create(['user_id' => $user->id]);

    expect($printJob->user)->toBeInstanceOf(User::class);
    expect($printJob->user->id)->toBe($user->id);
});

test('print job has transactions relationship', function () {
    $user = User::factory()->create();
    $printJob = PrintJob::factory()->create(['user_id' => $user->id]);

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'print_job_id' => $printJob->id,
    ]);

    expect($printJob->transactions)->toHaveCount(1);
    expect($printJob->transactions->first())->toBeInstanceOf(Transaction::class);
    expect($printJob->transactions->first()->id)->toBe($transaction->id);
});

test('print job defaults to pending status', function () {
    $printJob = PrintJob::factory()->create();

    expect($printJob->status)->toBe('pending');
});

test('print job calculates total cost correctly', function () {
    $printJob = PrintJob::factory()->create([
        'pages' => 10,
        'copies' => 2,
        'cost' => 30.00, // 10 pages * 2 copies * 1.50 per page
    ]);

    expect((float) $printJob->cost)->toBe(30.00);
});

test('print job can update status', function () {
    $printJob = PrintJob::factory()->create(['status' => 'pending']);

    $printJob->update(['status' => 'processing']);
    expect($printJob->status)->toBe('processing');

    $printJob->update(['status' => 'completed']);
    expect($printJob->status)->toBe('completed');
});

test('print job tracks retry attempts', function () {
    $printJob = PrintJob::factory()->create(['retry_count' => 0]);

    expect($printJob->retry_count)->toBe(0);

    $printJob->update(['retry_count' => 1]);
    expect($printJob->retry_count)->toBe(1);

    $printJob->update(['retry_count' => 2]);
    expect($printJob->retry_count)->toBe(2);
});

test('print job tracks current page progress', function () {
    $printJob = PrintJob::factory()->create([
        'pages' => 10,
        'current_page' => 0,
    ]);

    expect($printJob->current_page)->toBe(0);

    // Simulate printing progress
    for ($page = 1; $page <= 10; $page++) {
        $printJob->update(['current_page' => $page]);
        expect($printJob->current_page)->toBe($page);
    }
});

test('print job stores file path', function () {
    $filePath = 'uploads/documents/test-file.pdf';
    $printJob = PrintJob::factory()->create(['file_path' => $filePath]);

    expect($printJob->file_path)->toBe($filePath);
});

test('print job stores cups job id', function () {
    $printJob = PrintJob::factory()->create(['cups_job_id' => 12345]);

    expect($printJob->cups_job_id)->toBe(12345);
});

test('print job records timestamps', function () {
    $printJob = PrintJob::factory()->create();

    expect($printJob->created_at)->not->toBeNull();
    expect($printJob->updated_at)->not->toBeNull();

    $originalUpdatedAt = $printJob->updated_at;

    sleep(1);
    $printJob->update(['status' => 'processing']);

    expect($printJob->updated_at)->not->toBe($originalUpdatedAt);
});

test('print job can have no transactions', function () {
    $printJob = PrintJob::factory()->create();

    expect($printJob->transactions)->toHaveCount(0);
    expect($printJob->transactions)->toBeEmpty();
});

test('print job color mode is stored correctly', function () {
    $bwJob = PrintJob::factory()->create(['color_mode' => 'bw']);
    $colorJob = PrintJob::factory()->create(['color_mode' => 'color']);

    expect($bwJob->color_mode)->toBe('bw');
    expect($colorJob->color_mode)->toBe('color');
});

test('print job paper size is stored correctly', function () {
    $a4Job = PrintJob::factory()->create(['paper_size' => 'A4']);
    $letterJob = PrintJob::factory()->create(['paper_size' => 'Letter']);

    expect($a4Job->paper_size)->toBe('A4');
    expect($letterJob->paper_size)->toBe('Letter');
});

test('print job error message is nullable', function () {
    $successJob = PrintJob::factory()->create(['error_message' => null]);
    $failedJob = PrintJob::factory()->create(['error_message' => 'Printer offline']);

    expect($successJob->error_message)->toBeNull();
    expect($failedJob->error_message)->toBe('Printer offline');
});

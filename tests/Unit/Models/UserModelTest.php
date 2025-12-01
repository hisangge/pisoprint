<?php

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user has many print jobs relationship', function () {
    $user = User::factory()->create();

    PrintJob::factory()->count(3)->create([
        'user_id' => $user->id,
    ]);

    expect($user->printJobs)->toHaveCount(3);
    expect($user->printJobs->first())->toBeInstanceOf(PrintJob::class);
});

test('user has many transactions relationship', function () {
    $user = User::factory()->create();

    Transaction::factory()->count(5)->create([
        'user_id' => $user->id,
    ]);

    expect($user->transactions)->toHaveCount(5);
    expect($user->transactions->first())->toBeInstanceOf(Transaction::class);
});

test('user balance defaults to zero', function () {
    $user = User::factory()->create();

    expect((float) $user->balance)->toBe(0.0);
});

test('user balance can be updated', function () {
    $user = User::factory()->create(['balance' => 10.50]);

    expect((float) $user->balance)->toBe(10.50);

    $user->update(['balance' => 25.75]);

    expect((float) $user->balance)->toBe(25.75);
});

test('user last active timestamp updates', function () {
    $user = User::factory()->create([
        'last_active' => now()->subHours(2),
    ]);

    $originalTimestamp = $user->last_active;

    sleep(1);
    $user->update(['last_active' => now()]);

    expect($user->last_active)->not->toBe($originalTimestamp);
});

test('user can have zero print jobs', function () {
    $user = User::factory()->create();

    expect($user->printJobs)->toBeEmpty();
});

test('user can have zero transactions', function () {
    $user = User::factory()->create();

    expect($user->transactions)->toBeEmpty();
});

test('user balance is stored as decimal with two decimal places', function () {
    $user = User::factory()->create(['balance' => 10.567]);

    $user->refresh();

    // Database should round to 2 decimal places
    expect((float) $user->balance)->toBe(10.57);
});

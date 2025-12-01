<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    $this->user = User::factory()->create();
});

test('file upload endpoint validates using form request', function () {
    $response = $this->post(route('kiosk.upload.store'), [
        // No file provided
    ]);

    $response->assertSessionHasErrors('file');
});

test('file upload rejects non-pdf files', function () {
    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->post(route('kiosk.upload.store'), [
        'file' => $file,
    ]);

    $response->assertSessionHasErrors('file');
});

test('file upload accepts valid pdf file', function () {
    $file = UploadedFile::fake()->create('document.pdf', 1024);

    $response = $this->post(route('kiosk.upload.store'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('kiosk.preview'));
    $response->assertSessionHas('success');
});

test('calculate cost endpoint validates using form request', function () {
    $response = $this->post(route('kiosk.calculate-cost'), [
        'pages' => 0, // Invalid: must be at least 1
        'copies' => 5,
        'color_mode' => 'bw',
    ]);

    $response->assertSessionHasErrors('pages');
});

test('calculate cost rejects invalid color mode', function () {
    $response = $this->post(route('kiosk.calculate-cost'), [
        'pages' => 5,
        'copies' => 2,
        'color_mode' => 'rainbow', // Invalid
    ]);

    $response->assertSessionHasErrors('color_mode');
});

test('calculate cost returns correct pricing', function () {
    $response = $this->post(route('kiosk.calculate-cost'), [
        'pages' => 5,
        'copies' => 2,
        'color_mode' => 'bw',
    ]);

    $response->assertOk();
    $response->assertJson([
        'total_pages' => 10,
    ]);
});

test('calculate cost respects max copies limit', function () {
    $response = $this->post(route('kiosk.calculate-cost'), [
        'pages' => 5,
        'copies' => 150, // Exceeds max of 100
        'color_mode' => 'bw',
    ]);

    $response->assertSessionHasErrors('copies');
});

test('coin insertion endpoint validates using form request', function () {
    session(['guest_user_id' => $this->user->id]);

    $response = $this->postJson(route('kiosk.payment.coin'), [
        'amount' => -5.00, // Invalid: negative
        'coin_value' => 5,
        'esp32_id' => 'ESP32_001',
    ]);

    $response->assertStatus(422);
});

test('coin insertion accepts valid denomination', function () {
    session(['guest_user_id' => $this->user->id]);

    $response = $this->postJson(route('kiosk.payment.coin'), [
        'amount' => 5.00,
        'coin_value' => 5,
        'esp32_id' => 'ESP32_001',
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
    ]);
});

test('coin insertion rejects invalid denomination', function () {
    session(['guest_user_id' => $this->user->id]);

    $response = $this->postJson(route('kiosk.payment.coin'), [
        'amount' => 3.00,
        'coin_value' => 3, // Not an accepted coin (1, 5, 10, 20)
        'esp32_id' => 'ESP32_001',
    ]);

    $response->assertStatus(422);
});

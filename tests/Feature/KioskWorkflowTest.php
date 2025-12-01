<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
});

test('kiosk home page loads successfully', function () {
    $response = $this->get('/kiosk');

    $response->assertStatus(200);
});

test('can access file upload page', function () {
    $response = $this->get('/kiosk/upload');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('kiosk/file-selection')
            ->has('maxFileSize')
        );
});

test('can upload PDF file', function () {
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->post('/kiosk/upload', [
        'file' => $file,
    ]);

    $response->assertRedirect('/kiosk/preview');

    expect(session('upload_info'))->toBeArray()
        ->and(session('upload_info')['original_name'])->toBe('document.pdf');
});

test('cannot upload non-PDF files', function () {
    $file = UploadedFile::fake()->create('document.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    $response = $this->post('/kiosk/upload', [
        'file' => $file,
    ]);

    $response->assertSessionHasErrors('file');
});

test('cannot upload files exceeding size limit', function () {
    config(['printing.max_file_size' => 1024 * 1024]); // 1MB in bytes

    $file = UploadedFile::fake()->create('large.pdf', 2048, 'application/pdf'); // 2MB

    $response = $this->post('/kiosk/upload', [
        'file' => $file,
    ]);

    $response->assertSessionHasErrors('file');
});

test('print preview page shows uploaded file info', function () {
    session([
        'upload_info' => [
            'filename' => 'test.pdf',
            'original_name' => 'Test Document.pdf',
            'pages' => 5,
            'size' => 1024,
        ],
    ]);

    $response = $this->get('/kiosk/preview');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('kiosk/print-preview')
            ->has('uploadInfo')
        );
});

test('redirects to upload if no file uploaded', function () {
    $response = $this->get('/kiosk/preview');

    $response->assertRedirect('/kiosk/upload');
});

test('can calculate print cost', function () {
    $response = $this->postJson('/kiosk/calculate-cost', [
        'pages' => 5,
        'copies' => 2,
        'color_mode' => 'bw',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'total_pages' => 10,
        ])
        ->assertJsonStructure(['cost', 'price_per_page', 'total_pages']);
});

test('payment page loads with session data', function () {
    session([
        'upload_info' => [
            'file_name' => 'test.pdf',
            'pages' => 5,
        ],
        'required_amount' => 10.00,
    ]);

    $response = $this->get('/kiosk/payment');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('kiosk/payment')
            ->has('uploadInfo')
            ->has('paymentStatus')
        );
});

test('payment status endpoint returns current balance', function () {
    $user = User::factory()->create(['balance' => 5.00]);
    session(['guest_user_id' => $user->id, 'required_amount' => 10.00]);

    $response = $this->getJson('/kiosk/payment/status');

    $response->assertStatus(200)
        ->assertJson([
            'amountPaid' => 5.00,
            'amountRequired' => 10.00,
            'isComplete' => false,
        ]);
});

test('can process coin insertion', function () {
    $user = User::factory()->create(['balance' => 0]);
    session(['guest_user_id' => $user->id, 'required_amount' => 10.00]);

    $response = $this->postJson('/kiosk/payment/coin', [
        'amount' => 5.00,
        'coin_value' => 5.00,
        'esp32_id' => 'ESP32_001',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'balance' => 5.00,
        ]);

    $user->refresh();
    expect((float) $user->balance)->toBe(5.00);
});

test('can cancel payment and reset balance', function () {
    $user = User::factory()->create(['balance' => 5.00]);
    session(['guest_user_id' => $user->id]);

    $response = $this->post('/kiosk/payment/cancel', [
        'sessionId' => session()->getId(),
    ]);

    $response->assertRedirect('/kiosk');

    $user->refresh();
    expect((float) $user->balance)->toBe(0.0);
});

test('print status page loads with job info', function () {
    $user = User::factory()->create();
    session(['guest_user_id' => $user->id]);

    $printJob = \App\Models\PrintJob::factory()->create([
        'user_id' => $user->id,
        'status' => 'printing',
    ]);

    $response = $this->get("/kiosk/print-status?jobId={$printJob->id}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('kiosk/print-status')
            ->has('printJob')
        );
});

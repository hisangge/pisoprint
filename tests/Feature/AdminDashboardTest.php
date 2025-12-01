<?php

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create();
});

test('authenticated users can access admin dashboard', function () {
    $response = $this->actingAs($this->admin)->get('/admin');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats')
            ->has('recentJobs')
        );
});

test('guest users cannot access admin dashboard', function () {
    $response = $this->get('/admin');

    $response->assertRedirect('/login');
});

test('dashboard shows correct revenue statistics', function () {
    // Create transactions
    Transaction::factory()->create([
        'transaction_type' => 'print_deduction',
        'amount' => 10.00,
        'created_at' => now(),
    ]);

    Transaction::factory()->create([
        'transaction_type' => 'print_deduction',
        'amount' => 15.00,
        'created_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($this->admin)->get('/admin');

    $response->assertInertia(fn ($page) => $page
        ->where('stats.revenueToday', 10)
        ->where('stats.totalRevenue', 25)
    );
});

test('dashboard shows print job statistics', function () {
    // 5 jobs created today (3 completed, 2 pending)
    PrintJob::factory()->count(3)->create([
        'created_at' => now(),
        'status' => 'completed',
    ]);
    PrintJob::factory()->count(2)->create([
        'created_at' => now(),
        'status' => 'pending',
    ]);

    // 3 jobs created yesterday (all completed)
    PrintJob::factory()->count(3)->create([
        'created_at' => now()->subDay(),
        'status' => 'completed',
    ]);

    // 2 active jobs (printing) - created yesterday to not affect today's count
    PrintJob::factory()->count(2)->create([
        'status' => 'printing',
        'created_at' => now()->subDay(),
    ]);

    // Total active jobs should be: 2 pending (today) + 2 printing (yesterday) = 4
    // But query is for pending, processing, printing - so we need to check

    $response = $this->actingAs($this->admin)->get('/admin');

    $response->assertInertia(fn ($page) => $page
        ->where('stats.printJobsToday', 5)
        ->where('stats.totalPrintJobs', 10) // 3 + 2 + 3 + 2 = 10
        ->where('stats.activePrintJobs', 4) // 2 pending + 2 printing
    );
});

test('can access print jobs list page', function () {
    $response = $this->actingAs($this->admin)->get('/admin/print-jobs');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/print-jobs')
            ->has('printJobs.data')
            ->has('printJobs.meta')
        );
});

test('can search print jobs by filename', function () {
    PrintJob::factory()->create(['file_name' => 'invoice.pdf']);
    PrintJob::factory()->create(['file_name' => 'report.pdf']);

    $response = $this->actingAs($this->admin)
        ->get('/admin/print-jobs?search=invoice');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('printJobs.meta.total', 1)
        );
});

test('can filter print jobs by status', function () {
    PrintJob::factory()->count(3)->create(['status' => 'completed']);
    PrintJob::factory()->count(2)->create(['status' => 'failed']);

    $response = $this->actingAs($this->admin)
        ->get('/admin/print-jobs?status=completed');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('printJobs.meta.total', 3)
        );
});

test('print jobs list is paginated', function () {
    PrintJob::factory()->count(25)->create();

    $response = $this->actingAs($this->admin)->get('/admin/print-jobs?per_page=20');

    $response->assertInertia(fn ($page) => $page
        ->where('printJobs.data', fn ($jobs) => count($jobs) === 20)
        ->where('printJobs.meta.perPage', 20)
        ->where('printJobs.meta.total', 25)
        ->where('printJobs.meta.lastPage', 2)
    );
});

test('can view single print job details', function () {
    $printJob = PrintJob::factory()->create([
        'user_id' => $this->admin->id,
        'file_name' => 'test.pdf',
        'pages' => 5,
        'cost' => 10.00,
    ]);

    $response = $this->actingAs($this->admin)
        ->get("/admin/print-jobs/{$printJob->id}");

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/print-job-detail')
            ->where('printJob.id', $printJob->id)
            ->where('printJob.fileName', 'test.pdf')
            ->where('printJob.pages', 5)
            ->where('printJob.cost', 10)
        );
});

test('dashboard redirects authenticated users to admin dashboard', function () {
    $response = $this->actingAs($this->admin)->get('/dashboard');

    $response->assertRedirect('/admin');
});

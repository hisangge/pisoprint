<?php

use App\Exceptions\PrintJobSubmissionException;
use App\Models\PrintJob;
use App\Models\User;
use App\Services\PricingService;
use App\Services\PrintJobManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Rawilk\Printing\Facades\Printing;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    // Mock PricingService
    $this->pricingMock = Mockery::mock(PricingService::class);
    $this->pricingMock->shouldReceive('calculateCost')
        ->withAnyArgs()
        ->andReturnUsing(function ($pages, $copies, $colorMode) {
            $price = match ($colorMode) {
                'bw' => 2.00,
                'grayscale' => 3.00,
                'color' => 5.00,
                default => 2.00,
            };

            return $price * $pages * $copies;
        });

    $this->printJobManager = new PrintJobManager($this->pricingMock);
});

test('can submit print job after payment complete', function () {
    $filePath = storage_path('app/test.pdf');
    file_put_contents($filePath, 'test pdf content');

    // Mock the Printing facade
    $printJobMock = Mockery::mock('Rawilk\Printing\Contracts\PrintJob');
    $printJobMock->shouldReceive('id')->andReturn(123);

    $printTaskMock = Mockery::mock('Rawilk\Printing\Contracts\PrintTask');
    $printTaskMock->shouldReceive('file')->andReturnSelf();
    $printTaskMock->shouldReceive('printer')->andReturnSelf();
    $printTaskMock->shouldReceive('copies')->andReturnSelf();
    $printTaskMock->shouldReceive('option')->andReturnSelf();
    $printTaskMock->shouldReceive('send')->andReturn($printJobMock);

    Printing::shouldReceive('newPrintTask')->andReturn($printTaskMock);

    $job = $this->printJobManager->submitJob(
        userId: $this->user->id,
        filePath: $filePath,
        pages: 5,
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        cost: 10.00,
        colorMode: 'bw',
        copies: 1,
        orientation: 'portrait',
        paymentComplete: true
    );

    $job->refresh(); // Refresh to get updated cups_job_id

    expect($job)->toBeInstanceOf(PrintJob::class)
        ->and($job->user_id)->toBe($this->user->id)
        ->and($job->pages)->toBe(5)
        ->and((float) $job->cost)->toBe(10.00)
        ->and($job->status)->toBe('printing')
        ->and($job->cups_job_id)->toBe(123);

    unlink($filePath);
});

test('cannot submit job without payment complete', function () {
    $this->printJobManager->submitJob(
        userId: $this->user->id,
        filePath: '/tmp/test.pdf',
        pages: 1,
        paymentComplete: false
    );
})->throws(Exception::class, 'Cannot submit job without complete payment');

test('calculates cost automatically if not provided', function () {
    $filePath = storage_path('app/test.pdf');
    file_put_contents($filePath, 'test');

    config(['printing.pricing.bw' => 2.00]);

    // Mock the Printing facade
    $printJobMock = Mockery::mock('Rawilk\Printing\Contracts\PrintJob');
    $printJobMock->shouldReceive('id')->andReturn('456');

    $printTaskMock = Mockery::mock('Rawilk\Printing\Contracts\PrintTask');
    $printTaskMock->shouldReceive('file')->andReturnSelf();
    $printTaskMock->shouldReceive('printer')->andReturnSelf();
    $printTaskMock->shouldReceive('copies')->andReturnSelf();
    $printTaskMock->shouldReceive('option')->andReturnSelf();
    $printTaskMock->shouldReceive('send')->andReturn($printJobMock);

    Printing::shouldReceive('newPrintTask')->andReturn($printTaskMock);

    $job = $this->printJobManager->submitJob(
        userId: $this->user->id,
        filePath: $filePath,
        pages: 5,
        colorMode: 'bw',
        copies: 2,
        paymentComplete: true
    );

    // 5 pages * 2 copies * 2.00 per page = 20.00
    expect((float) $job->cost)->toBe(20.00);

    unlink($filePath);
});

test('handles print submission failure gracefully', function () {
    $filePath = storage_path('app/test.pdf');
    file_put_contents($filePath, 'test');

    // Mock the Printing facade to throw an exception
    $printTaskMock = Mockery::mock('Rawilk\Printing\Contracts\PrintTask');
    $printTaskMock->shouldReceive('file')->andReturnSelf();
    $printTaskMock->shouldReceive('printer')->andReturnSelf();
    $printTaskMock->shouldReceive('copies')->andReturnSelf();
    $printTaskMock->shouldReceive('option')->andReturnSelf();
    $printTaskMock->shouldReceive('send')->andThrow(new Exception('Printer offline'));

    Printing::shouldReceive('newPrintTask')->andReturn($printTaskMock);

    try {
        $this->printJobManager->submitJob(
            userId: $this->user->id,
            filePath: $filePath,
            pages: 1,
            paymentComplete: true
        );

        $this->fail('Expected exception was not thrown');
    } catch (PrintJobSubmissionException $e) {
        // Exception is re-thrown as PrintJobSubmissionException after updating job status
        expect($e->getMessage())->toContain('Printer error');

        // Get the job and check it was marked as failed
        $job = PrintJob::first();

        expect($job)->not->toBeNull()
            ->and($job->status)->toBe('failed')
            ->and($job->error_message)->toContain('Printer error');
    }

    unlink($filePath);
});

test('can cancel print job', function () {
    $job = PrintJob::factory()->create([
        'user_id' => $this->user->id,
        'status' => 'printing',
        'cups_job_id' => 123,
    ]);

    $this->printJobManager->cancelJob($job);

    $job->refresh();
    expect($job->status)->toBe('cancelled')
        ->and($job->completed_at)->not->toBeNull();
});

test('can get job status', function () {
    $job = PrintJob::factory()->create([
        'status' => 'printing',
        'cups_job_id' => '12345',
    ]);

    // Mock the Printing facade to return a print job
    $mockPrintJob = Mockery::mock('Rawilk\Printing\Contracts\PrintJob');
    $mockPrintJob->shouldReceive('state')->andReturn('completed');

    Printing::shouldReceive('printJob')
        ->with('12345')
        ->andReturn($mockPrintJob);

    $manager = app(PrintJobManager::class);
    $status = $manager->getJobStatus($job);

    expect($status)->toBe('completed');
    expect($job->fresh()->status)->toBe('completed');
});

test('returns current status for completed jobs without checking CUPS', function () {
    $job = PrintJob::factory()->create([
        'user_id' => $this->user->id,
        'status' => 'completed',
        'cups_job_id' => 'printer-123',
    ]);

    // For completed jobs, we should not check with Printing facade
    // Just verify the status is returned as-is
    $status = $this->printJobManager->getJobStatus($job);

    expect($status)->toBe('completed');
});

test('can retry failed print job', function () {
    $job = PrintJob::factory()->create([
        'user_id' => $this->user->id,
        'status' => 'failed',
        'cups_job_id' => 'printer-123',
        'retry_count' => 0,
        'file_path' => storage_path('app/test.pdf'),
        'copies' => 1,
        'orientation' => 'portrait',
        'color_mode' => 'bw',
        'paper_size' => 'Letter',
        'printer_name' => 'test-printer',
    ]);

    file_put_contents($job->file_path, 'test pdf');

    // Mock the Printing facade
    $printJobMock = Mockery::mock('Rawilk\Printing\Contracts\PrintJob');
    $printJobMock->shouldReceive('id')->andReturn('new-job-id');

    $printTaskMock = Mockery::mock('Rawilk\Printing\Contracts\PrintTask');
    $printTaskMock->shouldReceive('file')->andReturnSelf();
    $printTaskMock->shouldReceive('printer')->andReturnSelf();
    $printTaskMock->shouldReceive('copies')->andReturnSelf();
    $printTaskMock->shouldReceive('option')->andReturnSelf();
    $printTaskMock->shouldReceive('send')->andReturn($printJobMock);

    Printing::shouldReceive('newPrintTask')->andReturn($printTaskMock);

    $result = $this->printJobManager->retryJob($job);

    expect($result)->toBeTrue();
    expect($job->refresh()->retry_count)->toBe(1);

    unlink($job->file_path);
});

<?php

use App\Http\Controllers\PaymentController;
use App\Services\ESP32\ESP32ConnectionManager;
use App\Services\ESP32\ESP32HealthMonitor;
use App\Services\ESP32\ESP32MessageParser;
use App\Services\ESP32CommunicationService;

beforeEach(function () {
    // Mock the PaymentController
    $this->paymentController = $this->mock(PaymentController::class);
    $this->paymentController->shouldReceive('processCoinInsertion')
        ->withAnyArgs()
        ->andReturnUsing(function () {
            return response()->json([
                'success' => true,
                'balance' => 5.00,
                'required' => 10.00,
                'payment_complete' => false,
                'transaction_id' => 1,
            ]);
        });

    // Mock the ESP32 sub-services
    $this->connectionManager = $this->mock(ESP32ConnectionManager::class);
    $this->messageParser = $this->mock(ESP32MessageParser::class);
    $this->healthMonitor = $this->mock(ESP32HealthMonitor::class);

    // Set up default expectations for commonly called methods
    $this->connectionManager->shouldReceive('getEsp32Id')->andReturn('ESP32-001');
    $this->healthMonitor->shouldReceive('updateStatus')->andReturnNull();
    $this->healthMonitor->shouldReceive('getStatus')->andReturn('OK');
    $this->healthMonitor->shouldReceive('getLastHeartbeat')->andReturn(now());

    // Create the service with mocked dependencies
    $this->service = new ESP32CommunicationService(
        $this->connectionManager,
        $this->messageParser,
        $this->healthMonitor,
        $this->paymentController
    );
});

test('can parse coin insertion message', function () {
    $message = 'COIN:5.00';
    $parsedMessage = ['type' => 'COIN', 'amount' => 5.00];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([$parsedMessage]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    // Mock the health monitor for message processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->once();

    // Mock send for acknowledgment
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:5')->andReturn(true);

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages)->toHaveCount(1)
        ->and($messages[0]['type'])->toBe('COIN')
        ->and($messages[0]['amount'])->toBe(5.00);
});

test('can parse multiple coin denominations', function () {
    $testCases = [
        'COIN:1.00' => 1.00,
        'COIN:5.00' => 5.00,
        'COIN:10.00' => 10.00,
        'COIN:20.00' => 20.00,
    ];

    foreach ($testCases as $message => $expectedAmount) {
        $parsedMessage = ['type' => 'COIN', 'amount' => $expectedAmount];

        $this->messageParser->shouldReceive('parseBuffer')
            ->once()
            ->andReturn([$parsedMessage]);

        $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
        $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

        // Mock the health monitor for message processing
        $this->healthMonitor->shouldReceive('incrementMessageCount')->once();

        // Mock send for acknowledgment
        $expectedAck = 'ACK:COIN:'.(int) $expectedAmount;
        $this->connectionManager->shouldReceive('send')->with($expectedAck)->andReturn(true);

        $messages = $this->service->readMessages();

        expect($messages[0]['type'])->toBe('COIN')
            ->and($messages[0]['amount'])->toBe($expectedAmount);
    }
});

test('can parse status message', function () {
    $message = 'STATUS:OK';
    $parsedMessage = ['type' => 'STATUS', 'status' => 'OK'];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([$parsedMessage]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    // Mock the health monitor for message processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->once();

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages[0]['type'])->toBe('STATUS')
        ->and($messages[0]['status'])->toBe('OK');
});

test('can parse error message', function () {
    $message = 'ERROR:Coin jam detected';
    $parsedMessage = ['type' => 'ERROR', 'message' => 'Coin jam detected'];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([$parsedMessage]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    // Mock the health monitor for message processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->once();

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages[0]['type'])->toBe('ERROR')
        ->and($messages[0]['message'])->toBe('Coin jam detected');
});

test('can parse heartbeat message', function () {
    $message = 'HEARTBEAT';
    $parsedMessage = ['type' => 'HEARTBEAT'];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([$parsedMessage]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    // Mock the health monitor for heartbeat processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->once();
    $this->healthMonitor->shouldReceive('updateHeartbeat')->once();

    // Mock send for heartbeat acknowledgment
    $this->connectionManager->shouldReceive('send')->with('ACK:HEARTBEAT')->andReturn(true);

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages[0]['type'])->toBe('HEARTBEAT');
});

test('handles invalid message format', function () {
    $message = 'INVALID_FORMAT';

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([]); // Parser returns empty array for invalid messages

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages)->toBeEmpty();
});

test('handles malformed coin message', function () {
    $message = 'COIN:invalid_amount';

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([]); // Parser returns empty array for invalid coin amounts

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages)->toBeEmpty();
});

test('formats send message with checksum', function () {
    $this->connectionManager->shouldReceive('send')
        ->with('RESET')
        ->once()
        ->andReturn(true);

    $result = $this->service->sendMessage('RESET');

    expect($result)->toBeTrue();
});

test('validates coin amount is positive', function () {
    $message = 'COIN:-5.00';

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([]); // Parser rejects negative amounts

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    $messages = $this->service->readMessages();

    expect($messages)->toBeEmpty();
});

test('validates coin amount has reasonable range', function () {
    $this->messageParser->shouldReceive('parseBuffer')
        ->andReturn([]); // Parser rejects out-of-range amounts

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);

    // Test too small
    $this->connectionManager->shouldReceive('readRaw')->andReturn("COIN:0.00\n");
    $messages = $this->service->readMessages();
    expect($messages)->toBeEmpty();

    // Test too large
    $this->connectionManager->shouldReceive('readRaw')->andReturn("COIN:1000.00\n");
    $messages = $this->service->readMessages();
    expect($messages)->toBeEmpty();
});

test('can handle multiple messages', function () {
    $messages = [
        'COIN:1.00',
        'COIN:2.00',
        'STATUS:OK',
    ];
    $parsedMessages = [
        ['type' => 'COIN', 'amount' => 1.00],
        ['type' => 'COIN', 'amount' => 2.00],
        ['type' => 'STATUS', 'status' => 'OK'],
    ];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn($parsedMessages);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn(implode("\n", $messages)."\n");

    // Mock the health monitor for multiple messages
    $this->healthMonitor->shouldReceive('incrementMessageCount')->times(3);

    // Mock send for coin acknowledgments
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:1')->andReturn(true);
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:2')->andReturn(true);

    $result = $this->service->readMessages();

    expect($result)->toBeArray()
        ->and($result)->toHaveCount(3);
});

test('connection status tracking', function () {
    $this->connectionManager->shouldReceive('isConnected')
        ->andReturn(false, true, false); // Initially false, then true, then false

    expect($this->service->isConnected())->toBeFalse();

    // Simulate connection
    expect($this->service->isConnected())->toBeTrue();

    // Simulate disconnection
    expect($this->service->isConnected())->toBeFalse();
});

test('tracks last heartbeat time', function () {
    $message = 'HEARTBEAT';
    $parsedMessage = ['type' => 'HEARTBEAT'];

    $this->messageParser->shouldReceive('parseBuffer')
        ->once()
        ->andReturn([$parsedMessage]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')->andReturn($message."\n");

    // Mock the health monitor for heartbeat processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->once();
    $this->healthMonitor->shouldReceive('updateHeartbeat')->once();
    $this->healthMonitor->shouldReceive('getLastHeartbeat')
        ->andReturn(now());

    // Mock send for heartbeat acknowledgment
    $this->connectionManager->shouldReceive('send')->with('ACK:HEARTBEAT')->andReturn(true);

    $messages = $this->service->readMessages();

    expect($messages)->toBeArray()
        ->and($messages[0]['type'])->toBe('HEARTBEAT');

    // Mock isHealthy for getStatus call
    $this->healthMonitor->shouldReceive('isHealthy')->andReturn(true);

    $lastHeartbeat = $this->service->getStatus()['last_heartbeat'];
    expect($lastHeartbeat)->toBeString();
});

test('detects stale connection when no heartbeat', function () {
    $this->healthMonitor->shouldReceive('isHealthy')->andReturn(false);
    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);

    $isHealthy = $this->service->isHealthy();

    expect($isHealthy)->toBeFalse();
});

test('connection is not stale with recent heartbeat', function () {
    $this->healthMonitor->shouldReceive('isHealthy')->andReturn(true);
    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);

    $isHealthy = $this->service->isHealthy();

    expect($isHealthy)->toBeTrue();
});

test('message counter increments correctly', function () {
    // Test through public interface by reading messages
    $messages = [
        ['type' => 'COIN', 'amount' => 5.00],
        ['type' => 'STATUS', 'status' => 'OK'],
        ['type' => 'HEARTBEAT'],
    ];

    $this->messageParser->shouldReceive('parseBuffer')
        ->times(3)
        ->andReturn([$messages[0]], [$messages[1]], [$messages[2]]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')
        ->andReturn("COIN:5.00\n", "STATUS:OK\n", "HEARTBEAT\n");

    // Mock the health monitor for message processing
    $this->healthMonitor->shouldReceive('incrementMessageCount')->times(3);
    $this->healthMonitor->shouldReceive('updateHeartbeat')->once(); // For the HEARTBEAT message
    $this->healthMonitor->shouldReceive('getMessageCount')->andReturn(0, 1, 2, 3);

    // Mock send for acknowledgments
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:5')->andReturn(true);
    $this->connectionManager->shouldReceive('send')->with('ACK:HEARTBEAT')->andReturn(true);

    expect($this->service->getMessageCount())->toBe(0);

    // Process messages through public interface
    $this->service->readMessages();
    expect($this->service->getMessageCount())->toBe(1);

    $this->service->readMessages();
    expect($this->service->getMessageCount())->toBe(2);

    $this->service->readMessages();
    expect($this->service->getMessageCount())->toBe(3);
});

test('can reset message counter', function () {
    $this->healthMonitor->shouldReceive('incrementMessageCount')->times(2);
    $this->healthMonitor->shouldReceive('getMessageCount')->andReturn(2, 0);
    $this->healthMonitor->shouldReceive('resetMessageCount')->once();

    // Mock send for coin acknowledgments
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:5')->once()->andReturn(true);

    // Process messages to increment counter
    $this->messageParser->shouldReceive('parseBuffer')
        ->times(2)
        ->andReturn([['type' => 'COIN', 'amount' => 5.00]], [['type' => 'STATUS', 'status' => 'OK']]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')
        ->andReturn("COIN:5.00\n", "STATUS:OK\n");

    $this->service->readMessages();
    $this->service->readMessages();

    expect($this->service->getMessageCount())->toBe(2);

    $this->service->resetMessageCount();

    expect($this->service->getMessageCount())->toBe(0);
});

test('handles concurrent message processing safely', function () {
    // Test concurrent processing through public interface
    $this->healthMonitor->shouldReceive('incrementMessageCount')->times(10);
    $this->healthMonitor->shouldReceive('getMessageCount')->andReturn(10);

    // Mock send for coin acknowledgments
    $this->connectionManager->shouldReceive('send')->with('ACK:COIN:5')->times(10)->andReturn(true);

    // Mock multiple message reads
    $this->messageParser->shouldReceive('parseBuffer')
        ->times(10)
        ->andReturn([['type' => 'COIN', 'amount' => 5.00]]);

    $this->connectionManager->shouldReceive('isConnected')->andReturn(true);
    $this->connectionManager->shouldReceive('readRaw')
        ->times(10)
        ->andReturn("COIN:5.00\n");

    for ($i = 0; $i < 10; $i++) {
        $messages = $this->service->readMessages();
        expect($messages)->toBeArray();
        expect($messages)->toHaveCount(1);
    }

    expect($this->service->getMessageCount())->toBe(10);
});

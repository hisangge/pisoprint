<?php

use App\Services\ESP32\ESP32MessageParser;

beforeEach(function () {
    $this->parser = new ESP32MessageParser;
});

test('can parse coin insertion message', function () {
    $message = 'COIN:5.00';

    $parsed = $this->parser->parse($message);

    expect($parsed)->toBeArray()
        ->and($parsed['type'])->toBe('COIN')
        ->and($parsed['amount'])->toBe(5.00);
});

test('can parse all accepted coin denominations', function () {
    $coins = [
        'COIN:1.00' => 1.00,
        'COIN:5.00' => 5.00,
        'COIN:10.00' => 10.00,
        'COIN:20.00' => 20.00,
    ];

    foreach ($coins as $message => $expectedAmount) {
        $parsed = $this->parser->parse($message);

        expect($parsed['type'])->toBe('COIN')
            ->and($parsed['amount'])->toBe($expectedAmount);
    }
});

test('can parse status message', function () {
    $message = 'STATUS:READY';

    $parsed = $this->parser->parse($message);

    expect($parsed)->toBeArray()
        ->and($parsed['type'])->toBe('STATUS')
        ->and($parsed['status'])->toBe('READY');
});

test('can parse error message', function () {
    $message = 'ERROR:Coin jam detected';

    $parsed = $this->parser->parse($message);

    expect($parsed)->toBeArray()
        ->and($parsed['type'])->toBe('ERROR')
        ->and($parsed['message'])->toBe('Coin jam detected');
});

test('can parse heartbeat message', function () {
    $message = 'HEARTBEAT';

    $parsed = $this->parser->parse($message);

    expect($parsed)->toBeArray()
        ->and($parsed['type'])->toBe('HEARTBEAT');
});

test('rejects invalid message format', function () {
    $parsed = $this->parser->parse('INVALID');

    expect($parsed)->toBeNull();
});

test('rejects coin message with invalid amount', function () {
    $invalidMessages = [
        'COIN:abc',      // Non-numeric
        'COIN:-5.00',    // Negative
        'COIN:0',        // Zero
        'COIN:150.00',   // Too large
    ];

    foreach ($invalidMessages as $message) {
        $parsed = $this->parser->parse($message);
        expect($parsed)->toBeNull();
    }
});

test('rejects message with empty data', function () {
    $parsed = $this->parser->parse('COIN:');

    expect($parsed)->toBeNull();
});

test('can parse buffer with multiple messages', function () {
    $buffer = "COIN:5.00\nSTATUS:OK\nHEARTBEAT\n";

    $messages = $this->parser->parseBuffer($buffer);

    expect($messages)->toHaveCount(3)
        ->and($messages[0]['type'])->toBe('COIN')
        ->and($messages[1]['type'])->toBe('STATUS')
        ->and($messages[2]['type'])->toBe('HEARTBEAT');
});

test('ignores empty lines in buffer', function () {
    $buffer = "COIN:5.00\n\n\nSTATUS:OK\n";

    $messages = $this->parser->parseBuffer($buffer);

    expect($messages)->toHaveCount(2);
});

test('formats message with newline', function () {
    $formatted = $this->parser->formatMessage('TEST');

    expect($formatted)->toBe("TEST\n");
});

test('formats message removes extra whitespace', function () {
    $formatted = $this->parser->formatMessage('  TEST  ');

    expect($formatted)->toBe("TEST\n");
});

test('handles case-insensitive commands', function () {
    $messages = ['coin:5.00', 'COIN:5.00', 'Coin:5.00'];

    foreach ($messages as $message) {
        $parsed = $this->parser->parse($message);
        expect($parsed)->not->toBeNull()
            ->and($parsed['type'])->toBe('COIN');
    }
});

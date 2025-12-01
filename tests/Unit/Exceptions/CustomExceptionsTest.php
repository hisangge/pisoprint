<?php

use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\PaymentIncompleteException;
use App\Exceptions\PrintJobSubmissionException;
use App\Exceptions\SerialPortException;

test('insufficient balance exception has correct message', function () {
    $required = 10.00;
    $current = 5.00;

    $exception = new InsufficientBalanceException($required, $current);

    expect($exception)->toBeInstanceOf(Exception::class)
        ->and($exception->getMessage())->toContain('Insufficient balance')
        ->and($exception->getMessage())->toContain('10')
        ->and($exception->getMessage())->toContain('5');
});

test('insufficient balance exception can be caught', function () {
    $required = 10.00;
    $current = 5.00;

    expect(fn () => throw new InsufficientBalanceException($required, $current))
        ->toThrow(InsufficientBalanceException::class);
});

test('payment incomplete exception has default message', function () {
    $exception = new PaymentIncompleteException;

    expect($exception)->toBeInstanceOf(Exception::class)
        ->and($exception->getMessage())->toBe('Payment must be completed before proceeding');
});

test('payment incomplete exception accepts custom message', function () {
    $customMessage = 'Custom payment error message';
    $exception = new PaymentIncompleteException($customMessage);

    expect($exception->getMessage())->toBe($customMessage);
});

test('print job submission exception has default message', function () {
    $exception = new PrintJobSubmissionException;

    expect($exception)->toBeInstanceOf(Exception::class)
        ->and($exception->getMessage())->toBe('Failed to submit print job');
});

test('print job submission exception accepts custom message', function () {
    $customMessage = 'Printer offline';
    $exception = new PrintJobSubmissionException($customMessage);

    expect($exception->getMessage())->toBe($customMessage);
});

test('print job submission exception can wrap previous exception', function () {
    $previous = new Exception('Original error');
    $exception = new PrintJobSubmissionException('Wrapper error', $previous);

    expect($exception->getPrevious())->toBe($previous)
        ->and($exception->getPrevious()->getMessage())->toBe('Original error');
});

test('serial port exception has default message', function () {
    $exception = new SerialPortException;

    expect($exception)->toBeInstanceOf(Exception::class)
        ->and($exception->getMessage())->toBe('Serial port communication error');
});

test('serial port exception accepts custom message and code', function () {
    $customMessage = 'Port not found';
    $code = 404;
    $exception = new SerialPortException($customMessage, $code);

    expect($exception->getMessage())->toBe($customMessage)
        ->and($exception->getCode())->toBe($code);
});

test('all custom exceptions can be caught as generic exceptions', function () {
    expect(fn () => throw new InsufficientBalanceException(10, 5))
        ->toThrow(Exception::class);

    expect(fn () => throw new PaymentIncompleteException)
        ->toThrow(Exception::class);

    expect(fn () => throw new PrintJobSubmissionException)
        ->toThrow(Exception::class);

    expect(fn () => throw new SerialPortException)
        ->toThrow(Exception::class);
});

<?php

use App\Http\Requests\ProcessCoinInsertionRequest;
use Illuminate\Support\Facades\Validator;

test('process coin insertion request passes with valid data', function () {
    $request = new ProcessCoinInsertionRequest;

    $data = [
        'amount' => 5.00,
        'coin_value' => 5,
        'esp32_id' => 'ESP32_COIN_001',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('process coin insertion request validates accepted coin values', function () {
    $request = new ProcessCoinInsertionRequest;

    $acceptedCoins = [1, 5, 10, 20];

    foreach ($acceptedCoins as $coinValue) {
        $data = [
            'amount' => (float) $coinValue,
            'coin_value' => $coinValue,
            'esp32_id' => 'ESP32_COIN_001',
        ];

        $validator = Validator::make($data, $request->rules());

        expect($validator->passes())->toBeTrue();
    }
});

test('process coin insertion request fails with invalid coin value', function () {
    $request = new ProcessCoinInsertionRequest;

    $data = [
        'amount' => 2.00,
        'coin_value' => 2, // Not an accepted coin
        'esp32_id' => 'ESP32_COIN_001',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('coin_value'))->toBeTrue();
});

test('process coin insertion request fails with negative amount', function () {
    $request = new ProcessCoinInsertionRequest;

    $data = [
        'amount' => -5.00,
        'coin_value' => 5,
        'esp32_id' => 'ESP32_COIN_001',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('amount'))->toBeTrue();
});

test('process coin insertion request fails with excessive amount', function () {
    $request = new ProcessCoinInsertionRequest;

    $data = [
        'amount' => 150.00, // Max is 100
        'coin_value' => 20,
        'esp32_id' => 'ESP32_COIN_001',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('amount'))->toBeTrue();
});

test('process coin insertion request passes without optional fields', function () {
    $request = new ProcessCoinInsertionRequest;

    $data = [
        'amount' => 5.00,
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('process coin insertion request has custom error messages', function () {
    $request = new ProcessCoinInsertionRequest;

    expect($request->messages())->toBeArray()
        ->and($request->messages())->toHaveKey('amount.required')
        ->and($request->messages())->toHaveKey('coin_value.in')
        ->and($request->messages())->toHaveKey('esp32_id.string');
});

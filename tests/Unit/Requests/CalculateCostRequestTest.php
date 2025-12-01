<?php

use App\Http\Requests\CalculateCostRequest;
use Illuminate\Support\Facades\Validator;

test('calculate cost request passes with valid data', function () {
    $request = new CalculateCostRequest;

    $data = [
        'pages' => 5,
        'copies' => 2,
        'color_mode' => 'bw',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('calculate cost request validates all color modes', function () {
    $request = new CalculateCostRequest;

    $colorModes = ['bw', 'grayscale', 'color'];

    foreach ($colorModes as $colorMode) {
        $data = [
            'pages' => 5,
            'copies' => 2,
            'color_mode' => $colorMode,
        ];

        $validator = Validator::make($data, $request->rules());

        expect($validator->passes())->toBeTrue();
    }
});

test('calculate cost request fails with invalid color mode', function () {
    $request = new CalculateCostRequest;

    $data = [
        'pages' => 5,
        'copies' => 2,
        'color_mode' => 'invalid',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('color_mode'))->toBeTrue();
});

test('calculate cost request fails with zero pages', function () {
    $request = new CalculateCostRequest;

    $data = [
        'pages' => 0,
        'copies' => 2,
        'color_mode' => 'bw',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('pages'))->toBeTrue();
});

test('calculate cost request fails with zero copies', function () {
    $request = new CalculateCostRequest;

    $data = [
        'pages' => 5,
        'copies' => 0,
        'color_mode' => 'bw',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('copies'))->toBeTrue();
});

test('calculate cost request fails with too many copies', function () {
    $request = new CalculateCostRequest;

    $data = [
        'pages' => 5,
        'copies' => 101, // Max is 100
        'color_mode' => 'bw',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('copies'))->toBeTrue();
});

test('calculate cost request has custom error messages', function () {
    $request = new CalculateCostRequest;

    expect($request->messages())->toBeArray()
        ->and($request->messages())->toHaveKey('pages.required')
        ->and($request->messages())->toHaveKey('copies.max')
        ->and($request->messages())->toHaveKey('color_mode.in');
});

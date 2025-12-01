<?php

use App\Http\Requests\SubmitPrintJobRequest;
use Illuminate\Support\Facades\Validator;

test('submit print job request passes with valid data', function () {
    $request = new SubmitPrintJobRequest;

    $data = [
        'color_mode' => 'bw',
        'copies' => 5,
        'orientation' => 'portrait',
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('submit print job request validates all color modes', function () {
    $request = new SubmitPrintJobRequest;

    $colorModes = ['bw', 'grayscale', 'color'];

    foreach ($colorModes as $colorMode) {
        $data = [
            'color_mode' => $colorMode,
            'copies' => 2,
        ];

        $validator = Validator::make($data, $request->rules());

        expect($validator->passes())->toBeTrue();
    }
});

test('submit print job request validates orientations', function () {
    $request = new SubmitPrintJobRequest;

    $orientations = ['portrait', 'landscape'];

    foreach ($orientations as $orientation) {
        $data = [
            'color_mode' => 'bw',
            'copies' => 2,
            'orientation' => $orientation,
        ];

        $validator = Validator::make($data, $request->rules());

        expect($validator->passes())->toBeTrue();
    }
});

test('submit print job request fails with invalid color mode', function () {
    $request = new SubmitPrintJobRequest;

    $data = [
        'color_mode' => 'rainbow',
        'copies' => 2,
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('color_mode'))->toBeTrue();
});

test('submit print job request fails with too many copies', function () {
    $request = new SubmitPrintJobRequest;

    $data = [
        'color_mode' => 'bw',
        'copies' => 150,
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('copies'))->toBeTrue();
});

test('submit print job request passes without orientation', function () {
    $request = new SubmitPrintJobRequest;

    $data = [
        'color_mode' => 'bw',
        'copies' => 2,
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('submit print job request has custom error messages', function () {
    $request = new SubmitPrintJobRequest;

    expect($request->messages())->toBeArray()
        ->and($request->messages())->toHaveKey('color_mode.required')
        ->and($request->messages())->toHaveKey('copies.max')
        ->and($request->messages())->toHaveKey('orientation.in');
});

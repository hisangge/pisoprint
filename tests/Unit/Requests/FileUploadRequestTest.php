<?php

use App\Http\Requests\FileUploadRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

test('file upload request passes with valid pdf file', function () {
    $request = new FileUploadRequest;

    $data = [
        'file' => UploadedFile::fake()->create('document.pdf', 1024), // 1MB
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->passes())->toBeTrue();
});

test('file upload request fails when file is missing', function () {
    $request = new FileUploadRequest;

    $data = [];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('file'))->toBeTrue();
});

test('file upload request fails with non-pdf file', function () {
    $request = new FileUploadRequest;

    $data = [
        'file' => UploadedFile::fake()->create('document.docx', 1024),
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('file'))->toBeTrue();
});

test('file upload request fails with file too large', function () {
    $request = new FileUploadRequest;

    // Create file larger than max size (50MB)
    $data = [
        'file' => UploadedFile::fake()->create('document.pdf', 52000), // 52MB
    ];

    $validator = Validator::make($data, $request->rules());

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->has('file'))->toBeTrue();
});

test('file upload request has custom error messages', function () {
    $request = new FileUploadRequest;

    expect($request->messages())->toBeArray()
        ->and($request->messages())->toHaveKey('file.required')
        ->and($request->messages())->toHaveKey('file.mimes')
        ->and($request->messages())->toHaveKey('file.max');
});

test('file upload request is authorized', function () {
    $request = new FileUploadRequest;

    expect($request->authorize())->toBeTrue();
});

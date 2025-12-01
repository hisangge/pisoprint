<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxFileSizeKb = config('printing.max_file_size') / 1024; // Convert bytes to KB
        
        return [
            'file' => [
                'required',
                'file',
                'mimes:pdf',
                'max:'.$maxFileSizeKb,
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxFileSizeMb = round(config('printing.max_file_size') / (1024 * 1024), 0);
        
        return [
            'file.required' => 'Please select a PDF file to upload.',
            'file.file' => 'The uploaded item must be a file.',
            'file.mimes' => 'Only PDF files are supported.',
            'file.max' => 'The file size must not exceed '.$maxFileSizeMb.'MB.',
        ];
    }
}

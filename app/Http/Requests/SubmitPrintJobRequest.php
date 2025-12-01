<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPrintJobRequest extends FormRequest
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
        return [
            'color_mode' => ['required', 'in:bw,grayscale,color'],
            'copies' => ['required', 'integer', 'min:1', 'max:'.config('printing.max_copies', 100)],
            'orientation' => ['nullable', 'in:portrait,landscape'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'color_mode.required' => 'Please select a color mode (black & white, grayscale, or color).',
            'color_mode.in' => 'Invalid color mode selected.',
            'copies.required' => 'The number of copies is required.',
            'copies.integer' => 'The number of copies must be a valid integer.',
            'copies.min' => 'You must print at least 1 copy.',
            'copies.max' => 'You cannot print more than '.config('printing.max_copies', 100).' copies at once.',
            'orientation.in' => 'The orientation must be either portrait or landscape.',
        ];
    }
}

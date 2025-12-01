<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalculateCostRequest extends FormRequest
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
            'pages' => ['required', 'integer', 'min:1'],
            'copies' => ['required', 'integer', 'min:1', 'max:'.config('printing.max_copies', 100)],
            'color_mode' => ['required', 'in:bw,grayscale,color'],
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
            'pages.required' => 'The number of pages is required.',
            'pages.integer' => 'The number of pages must be a valid integer.',
            'pages.min' => 'The number of pages must be at least 1.',
            'copies.required' => 'The number of copies is required.',
            'copies.integer' => 'The number of copies must be a valid integer.',
            'copies.min' => 'You must print at least 1 copy.',
            'copies.max' => 'You cannot print more than '.config('printing.max_copies', 100).' copies at once.',
            'color_mode.required' => 'Please select a color mode.',
            'color_mode.in' => 'The color mode must be either black & white, grayscale, or color.',
        ];
    }
}

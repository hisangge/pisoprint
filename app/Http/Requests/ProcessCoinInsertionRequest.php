<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessCoinInsertionRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0', 'max:100'],
            'coin_value' => ['nullable', 'numeric', 'in:1,5,10,20'],
            'esp32_id' => ['nullable', 'string', 'max:50'],
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
            'amount.required' => 'The coin amount is required.',
            'amount.numeric' => 'The coin amount must be a valid number.',
            'amount.min' => 'The coin amount must be greater than zero.',
            'amount.max' => 'Invalid coin amount detected.',
            'coin_value.numeric' => 'The coin value must be a valid number.',
            'coin_value.in' => 'Only ₱1, ₱5, ₱10, and ₱20 coins are accepted.',
            'esp32_id.string' => 'The ESP32 ID must be a valid string.',
            'esp32_id.max' => 'The ESP32 ID is too long.',
        ];
    }
}

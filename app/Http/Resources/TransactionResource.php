<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->transaction_type,
            'amount' => (float) $this->amount,
            'balanceBefore' => (float) $this->balance_before,
            'balanceAfter' => (float) $this->balance_after,
            'description' => $this->description,
            'coinValue' => $this->coin_value ? (float) $this->coin_value : null,
            'coinCount' => $this->coin_count,
            'sessionId' => $this->session_id,
            'esp32Id' => $this->esp32_id,
            'isVerified' => (bool) $this->is_verified,
            'printJobId' => $this->print_job_id,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrintJobResource extends JsonResource
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
            'fileName' => $this->file_name,
            'filePath' => $this->when($request->user()?->id === $this->user_id, $this->file_path),
            'fileSize' => $this->file_size,
            'pages' => $this->pages,
            'copies' => $this->copies,
            'colorMode' => $this->color_mode,
            'orientation' => $this->orientation,
            'paperSize' => $this->paper_size,
            'cost' => (float) $this->cost,
            'totalCost' => (float) $this->total_cost,
            'status' => $this->status,
            'priority' => $this->priority,
            'currentPage' => $this->current_page,
            'cupsJobId' => $this->cups_job_id,
            'printerName' => $this->printer_name,
            'errorMessage' => $this->error_message,
            'retryCount' => $this->retry_count,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->when($request->user()?->id === $this->user_id, $this->user->email),
            ],
            'createdAt' => $this->created_at->toIso8601String(),
            'startedAt' => $this->started_at?->toIso8601String(),
            'completedAt' => $this->completed_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrintJob extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'pages',
        'current_page',
        'cost',
        'status',
        'priority',
        'started_at',
        'completed_at',
        'error_message',
        'retry_count',
        'printer_name',
        'cups_job_id',
        'color_mode',
        'paper_size',
        'orientation',
        'copies',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'pages' => 'integer',
            'current_page' => 'integer',
            'cost' => 'decimal:2',
            'priority' => 'integer',
            'cups_job_id' => 'integer',
            'copies' => 'integer',
            'retry_count' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the print job.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the transactions for this print job.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Scope a query to only include active jobs.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['pending', 'processing', 'printing']);
    }

    /**
     * Scope a query to only include completed jobs.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include failed jobs.
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Check if the job is currently active.
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['pending', 'processing', 'printing']);
    }

    /**
     * Check if the job is complete.
     */
    public function isComplete(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the job failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Get the total cost including copies.
     */
    protected function totalCost(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->cost * $this->copies,
        );
    }
}

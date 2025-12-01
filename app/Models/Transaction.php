<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'transaction_type',
        'amount',
        'balance_before',
        'balance_after',
        'print_job_id',
        'coin_count',
        'coin_value',
        'description',
        'session_id',
        'esp32_id',
        'is_verified',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'coin_count' => 'integer',
            'coin_value' => 'decimal:2',
            'is_verified' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the print job associated with this transaction.
     */
    public function printJob(): BelongsTo
    {
        return $this->belongsTo(PrintJob::class);
    }

    /**
     * Scope a query to only include coin insertions.
     */
    public function scopeCoinInsertions(Builder $query): Builder
    {
        return $query->where('transaction_type', 'coin_insert');
    }

    /**
     * Scope a query to only include print deductions.
     */
    public function scopePrintDeductions(Builder $query): Builder
    {
        return $query->where('transaction_type', 'print_deduct');
    }

    /**
     * Scope a query to only include refunds.
     */
    public function scopeRefunds(Builder $query): Builder
    {
        return $query->where('transaction_type', 'refund');
    }

    /**
     * Scope a query for a specific session.
     */
    public function scopeForSession(Builder $query, string $sessionId): Builder
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Check if this is a coin insertion.
     */
    public function isCoinInsertion(): bool
    {
        return $this->transaction_type === 'coin_insert';
    }

    /**
     * Check if this is a print deduction.
     */
    public function isPrintDeduction(): bool
    {
        return $this->transaction_type === 'print_deduct';
    }

    /**
     * Check if this is a refund.
     */
    public function isRefund(): bool
    {
        return $this->transaction_type === 'refund';
    }
}

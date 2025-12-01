<?php

namespace App\Exceptions;

use Exception;

class InsufficientBalanceException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(float $required, float $current)
    {
        parent::__construct(
            "Insufficient balance. Required: ₱{$required}, Current: ₱{$current}"
        );
    }
}

<?php

namespace App\Exceptions;

use Exception;

class PaymentIncompleteException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Payment must be completed before proceeding')
    {
        parent::__construct($message);
    }
}

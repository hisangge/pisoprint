<?php

namespace App\Exceptions;

use Exception;
use Throwable;

class PrintJobSubmissionException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Failed to submit print job', ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}

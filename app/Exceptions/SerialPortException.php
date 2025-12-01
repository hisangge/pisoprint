<?php

namespace App\Exceptions;

use Exception;

class SerialPortException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Serial port communication error', int $code = 0)
    {
        parent::__construct($message, $code);
    }
}

<?php
declare(strict_types=1);

namespace App;

interface AuthenticationProvider
{
    /**
     * Validates credentials and returns a User entity if successful.
     * Returns null on failure.
     */
    public function validate(string $username, string $password): ?\App\Models\User;
}

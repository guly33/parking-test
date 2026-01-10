<?php
declare(strict_types=1);

namespace App;

use PDO;
use App\Models\User;

class DatabaseAuthProvider implements AuthenticationProvider
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function validate(string $username, string $password): ?User
    {
        $userModel = new User($this->db);
        // findLocal returns the raw array with password_hash for verification
        $row = $userModel->findLocal($username);

        if ($row && password_verify($password, $row['password_hash'])) {
            // Return clean Entity without password hash
            return User::fromRow($row);
        }

        return null;
    }
}

<?php
declare(strict_types=1);

namespace App\Models;

use PDO;

class User
{
    private $pdo;

    // Entity Properties
    public $id;
    public $username;
    public $provider; // 'local', 'google', 'okta'
    public $providerId; // unique ID from external provider

    public function __construct(PDO $pdo = null)
    {
        $this->pdo = $pdo;
    }

    public static function fromRow(array $row): self
    {
        $user = new self();
        $user->id = (int) $row['id'];
        $user->username = $row['username'];
        $user->provider = $row['provider'] ?? 'local';
        $user->providerId = $row['provider_id'] ?? null;
        return $user;
    }

    public function findLocal(string $username): ?array
    {
        // Returns raw row including password_hash for validation service to check
        // We separate concerns: Model returns data, AuthProvider checks password
        $sql = "SELECT * FROM users WHERE username = :username AND (provider = 'local' OR provider IS NULL)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByProvider(string $provider, string $providerId): ?self
    {
        $sql = "SELECT * FROM users WHERE provider = :provider AND provider_id = :pid";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['provider' => $provider, 'pid' => $providerId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return self::fromRow($row);
        }
        return null;
    }

    public function createExternal(string $username, string $provider, string $providerId): self
    {
        $stmt = $this->pdo->prepare("INSERT INTO users (username, provider, provider_id) VALUES (:u, :p, :pid)");
        $stmt->execute(['u' => $username, 'p' => $provider, 'pid' => $providerId]);

        $user = new self();
        $user->id = (int) $this->pdo->lastInsertId();
        $user->username = $username;
        $user->provider = $provider;
        $user->providerId = $providerId;
        return $user;
    }
}

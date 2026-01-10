<?php
declare(strict_types=1);

namespace App;

use PDO;
use PDOException;

class Database
{
    private $pdo;

    public function connect(): PDO
    {
        if ($this->pdo) {
            return $this->pdo;
        }

        $host = getenv('DB_HOST') ?: 'db';
        $db = getenv('DB_NAME') ?: 'parking';
        $user = getenv('DB_USER') ?: 'user';
        $pass = getenv('DB_PASS') ?: 'password';
        $port = getenv('DB_PORT') ?: '5432';

        $dsn = "pgsql:host=$host;port=$port;dbname=$db;";

        try {
            $this->pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            return $this->pdo;
        } catch (PDOException $e) {
            throw new \Exception($e->getMessage());
        }
    }
}

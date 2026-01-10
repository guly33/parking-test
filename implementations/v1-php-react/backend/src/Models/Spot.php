<?php
declare(strict_types=1);

namespace App\Models;

use PDO;

class Spot
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(): array
    {
        return $this->pdo->query("SELECT * FROM spots ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id, bool $lock = false)
    {
        $sql = "SELECT * FROM spots WHERE id = :id";
        if ($lock) {
            $sql .= " FOR UPDATE";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

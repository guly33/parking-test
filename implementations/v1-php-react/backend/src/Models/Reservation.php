<?php
declare(strict_types=1);

namespace App\Models;

use PDO;

class Reservation
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getActiveInRange(string $start, string $end): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, spot_id, user_id, start_time, end_time, status 
            FROM reservations 
            WHERE status = 'active' 
            AND start_time >= :start 
            AND start_time <= :end
        ");
        $stmt->execute(['start' => $start, 'end' => $end]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countOverlapping(int $spotId, string $start, string $end): int
    {
        // Using strict comparison < and > as fixed in previous step
        $checkStmt = $this->pdo->prepare("
            SELECT count(*) as cnt FROM reservations 
            WHERE spot_id = :spot_id 
            AND status = 'active'
            AND (
                (start_time < :end AND end_time > :start)
            )
        ");
        $checkStmt->execute([
            'spot_id' => $spotId,
            'start' => $start,
            'end' => $end
        ]);
        return (int) $checkStmt->fetch()['cnt'];
    }

    public function create(int $spotId, int $userId, string $startTime, string $endTime): void
    {
        $insert = $this->pdo->prepare("
            INSERT INTO reservations (spot_id, user_id, start_time, end_time, status)
            VALUES (:spot_id, :user, :start, :end, 'active')
        ");
        $insert->execute([
            'spot_id' => $spotId,
            'user' => $userId,
            'start' => $startTime,
            'end' => $endTime
        ]);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM reservations WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public function complete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE reservations SET status = 'completed' WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    public function getStats(): array
    {
        $stmt = $this->pdo->query("
            SELECT spot_id, COUNT(*) as usage_count 
            FROM reservations 
            GROUP BY spot_id 
            ORDER BY spot_id ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

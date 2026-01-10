<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Database;
use Dotenv\Dotenv;

// Load Env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

try {
    $db = (new Database())->connect();

    echo "[" . date('Y-m-d H:i:s') . "] Running Stale Reservation Checker...\n";

    // Update reservations where end_time has passed and status is still 'active'
    // Find stale reservations
    $stmt = $db->prepare("
        SELECT r.id, r.spot_id 
        FROM reservations r
        WHERE r.status = 'active' 
        AND r.end_time < :now
    ");
    // Use proper server local time matching Controller
    $now = date('Y-m-d H:i:s');
    $stmt->execute(['now' => $now]);
    $stale = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($stale) > 0) {
        foreach ($stale as $res) {
            $update = $db->prepare("UPDATE reservations SET status = 'completed' WHERE id = :id");
            $update->execute(['id' => $res['id']]);
            echo "[" . date('H:i:s') . "] Auto-released Spot #{$res['spot_id']} (Reservation ID {$res['id']})\n";

            // NOTIFY WS
            $payload = json_encode(['event' => 'update', 'spot_id' => $res['spot_id'], 'status' => 'available']);
            $opts = ['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload, 'timeout' => 1]];
            @file_get_contents('http://websocket:8080/broadcast', false, stream_context_create($opts));
        }
    } else {
        // Optional: reduce noise, or keep for heartbeat
        // echo "No stale reservations found.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

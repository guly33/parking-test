<?php
declare(strict_types=1);

namespace App;

use PDO;
use Exception;
use App\Models\Spot;
use App\Models\Reservation;

class ReservationController
{
    private $db;
    private $spotModel;
    private $reservationModel;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->spotModel = new Spot($db);
        $this->reservationModel = new Reservation($db);
    }

    public function getSpots()
    {
        $dateParam = $_GET['date'] ?? date('Y-m-d');
        $startOfDay = date('Y-m-d 00:00:00', strtotime($dateParam));
        $endOfDay = date('Y-m-d 23:59:59', strtotime($dateParam));

        // 1. Get All Spots
        $spotsDir = $this->spotModel->getAll();

        // 2. Get Reservations for the day
        $reservations = $this->reservationModel->getActiveInRange($startOfDay, $endOfDay);

        // 3. Merge
        foreach ($spotsDir as &$spot) {
            $spot['reservations'] = [];
            foreach ($reservations as $res) {
                if ($res['spot_id'] == $spot['id']) {
                    $spot['reservations'][] = $res;
                }
            }
        }

        echo json_encode($spotsDir);
    }

    private function authenticate(): int
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        list(, $token) = explode(' ', $authHeader);

        if (!$token) {
            throw new Exception('No token provided');
        }

        $key = getenv('JWT_SECRET') ?: 'default_dev_secret';
        $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
        return (int) $decoded->uid;
    }

    private function broadcastUpdate(int $spotId)
    {
        // Non-blocking fire-and-forget to WS Broker
        $payload = json_encode([
            'event' => 'update',
            'spot_id' => $spotId,
            'status' => 'changed'
        ]);

        $opts = [
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $payload,
                'timeout' => 1
            ]
        ];

        @file_get_contents('http://websocket:8080/broadcast', false, stream_context_create($opts));
    }

    public function createReservation()
    {
        try {
            $userId = $this->authenticate();
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $spotId = $data['spot_id'];
        $start = $data['start_time'];
        $end = $data['end_time'];

        // Validate: Start time must not be in the past (allow 5 min buffer)
        $startTimeTs = strtotime($start);
        if ($startTimeTs < (time() - 300)) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot book in the past']);
            return;
        }

        try {
            $this->db->beginTransaction();

            // CRITIAL: Pessimistic Lock
            $spot = $this->spotModel->findById($spotId, true);

            if (!$spot) {
                $this->db->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Spot not found']);
                return;
            }

            // Check for Overlap
            $count = $this->reservationModel->countOverlapping($spotId, $start, $end);

            if ($count > 0) {
                $this->db->rollBack();
                http_response_code(409); // Conflict
                echo json_encode(['error' => 'Spot already reserved']);
                return;
            }

            // Perform Booking
            $this->reservationModel->create($spotId, $userId, $start, $end);

            $this->db->commit();

            // Notify WS
            $this->broadcastUpdate((int) $spotId);

            http_response_code(201);
            echo json_encode(['message' => 'Reservation created']);

        } catch (Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function getStats()
    {
        $stats = $this->reservationModel->getStats();
        echo json_encode($stats);
    }

    public function completeReservation($id)
    {
        try {
            $userId = $this->authenticate();

            $reservation = $this->reservationModel->findById((int) $id);
            if (!$reservation) {
                http_response_code(404);
                echo json_encode(['error' => 'Reservation not found']);
                return;
            }

            if ((int) $reservation['user_id'] !== $userId) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden: You do not own this reservation']);
                return;
            }

            $this->reservationModel->complete((int) $id);

            // Notify WS
            $this->broadcastUpdate((int) $reservation['spot_id']);

            echo json_encode(['message' => 'Reservation completed', 'id' => $id]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
        }
    }
}


<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Database;
use App\AuthService;
use App\ReservationController;
use Dotenv\Dotenv;

// Load Env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Router
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = (new Database())->connect();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Routes
if ($method === 'POST' && $uri === '/api/login') {
    $authProvider = new \App\DatabaseAuthProvider($db);
    (new AuthService($authProvider))->login();
} elseif ($method === 'GET' && $uri === '/api/spots') {
    (new ReservationController($db))->getSpots();
} elseif ($method === 'GET' && $uri === '/api/stats') {
    (new ReservationController($db))->getStats();
} elseif ($method === 'POST' && $uri === '/api/reservations') {
    (new ReservationController($db))->createReservation();
} elseif ($method === 'PUT' && preg_match('/^\/api\/reservations\/(\d+)\/complete$/', $uri, $matches)) {
    (new ReservationController($db))->completeReservation($matches[1]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}

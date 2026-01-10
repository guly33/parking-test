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

// Dispatch
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. Static File Serving (Frontend)
// Check if file exists in current directory (public) or in the separate frontend build dir
$frontendDir = '/var/www/frontend';
$filePath = $frontendDir . $uri;

// Helper to serve file with content type
function serveFile($path)
{
    $ext = pathinfo($path, PATHINFO_EXTENSION);
    $mimes = [
        'css' => 'text/css',
        'js' => 'text/javascript', // 'application/javascript' is better but text/javascript is standard for browsers
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon'
    ];
    if (isset($mimes[$ext]))
        header("Content-Type: $mimes[$ext]");
    readfile($path);
    exit;
}

if ($uri !== '/' && file_exists(__DIR__ . $uri) && is_file(__DIR__ . $uri)) {
    // Served by Apache usually, but if here:
    serveFile(__DIR__ . $uri);
}

if ($uri !== '/' && file_exists($filePath) && is_file($filePath)) {
    serveFile($filePath);
}

// 2. API Routes
if (strpos($uri, '/api') === 0) {
    // Headers
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
    header("Content-Type: application/json");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
        exit(0);

    // DB Init
    try {
        $db = (new Database())->connect();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // Router
    $router = new \App\Router();

    $router->add('POST', '/api/login', function () use ($db) {
        $authProvider = new \App\DatabaseAuthProvider($db);
        (new AuthService($authProvider))->login();
    });

    $router->add('GET', '/api/spots', function () use ($db) {
        (new ReservationController($db))->getSpots();
    });

    $router->add('GET', '/api/stats', function () use ($db) {
        (new ReservationController($db))->getStats();
    });

    $router->add('POST', '/api/reservations', function () use ($db) {
        (new ReservationController($db))->createReservation();
    });

    // Dynamic Route Example: /api/reservations/123/complete
    $router->add('PUT', '/api/reservations/{id}/complete', function ($id) use ($db) {
        (new ReservationController($db))->completeReservation($id);
    });

    $router->dispatch($method, $uri);
    exit;
}

// 3. SPA Fallback
if (file_exists($frontendDir . '/index.html')) {
    readfile($frontendDir . '/index.html');
} elseif (file_exists(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
} else {
    echo "Frontend not found. Did you build the assets?";
}

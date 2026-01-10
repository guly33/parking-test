<?php
declare(strict_types=1);

namespace App;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable $handler): void
    {
        // Convert route like /api/reservations/{id}/complete to regex
        // Escape forward slashes, replace {param} with capture group
        $start = $path;
        $path = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([a-zA-Z0-9_]+)', $path);
        $regex = "#^" . $path . "$#";

        $this->routes[] = [
            'method' => $method,
            'regex' => $regex,
            'handler' => $handler
        ];
    }

    public function dispatch(string $method, string $uri)
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['regex'], $uri, $matches)) {
                array_shift($matches); // Remove full match
                return call_user_func_array($route['handler'], $matches);
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }
}

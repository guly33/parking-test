<?php
declare(strict_types=1);

namespace App;

use PDO;
use Firebase\JWT\JWT;

class AuthService
{
    private $provider;
    private $key;

    public function __construct(AuthenticationProvider $provider)
    {
        $this->provider = $provider;
        $this->key = getenv('JWT_SECRET') ?: 'default_dev_secret';
    }

    public function login()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $user = $this->provider->validate($username, $password);

        if ($user) {
            $payload = [
                'iss' => 'parking-v1',
                'aud' => 'parking-v1',
                'iat' => time(),
                'exp' => time() + 3600,
                'sub' => $user->username,
                'uid' => $user->id
            ];

            $jwt = JWT::encode($payload, $this->key, 'HS256');
            echo json_encode([
                'token' => $jwt,
                'user' => $user->username,
                'userId' => $user->id
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    }
}

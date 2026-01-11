<?php
declare(strict_types=1);

namespace App;

class Logger
{
    private static string $logFile = __DIR__ . '/../server.log';

    public static function log(string $message): void
    {
        self::write('INFO', $message);
    }

    public static function error(string $message): void
    {
        self::write('ERROR', $message);
    }

    private static function write(string $level, string $message): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $formattedMessage = "[$timestamp] [$level] $message" . PHP_EOL;

        // Write to file
        file_put_contents(self::$logFile, $formattedMessage, FILE_APPEND);

        // Write to console (stdout for INFO, stderr for ERROR)
        if ($level === 'ERROR') {
            file_put_contents('php://stderr', $formattedMessage);
        } else {
            file_put_contents('php://stdout', $formattedMessage);
        }
    }
}

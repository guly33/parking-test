import { appendFile } from "node:fs/promises";

export class Logger {
    private static logFile = "./server.log";

    static async info(message: string) {
        await this.write("INFO", message);
    }

    static async error(message: string) {
        await this.write("ERROR", message);
    }

    private static async write(level: string, message: string) {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        const formatted = `[${timestamp}] [${level}] ${message}\n`;

        try {
            await appendFile(this.logFile, formatted);
        } catch (e) {
            console.error("Failed to write to log file", e);
        }

        if (level === "ERROR") {
            console.error(formatted.trim());
        } else {
            console.log(formatted.trim());
        }
    }
}

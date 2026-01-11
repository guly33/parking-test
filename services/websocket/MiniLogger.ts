
const LOG_FILE = "server.log";

export const MiniLogger = {
    info: async (msg: string) => {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [INFO] ${msg}\n`;
        console.log(line.trim());
        await Bun.write(LOG_FILE, line, { append: true, createPath: false }); // Append to file
    },
    error: async (msg: string) => {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [ERROR] ${msg}\n`;
        console.error(line.trim());
        await Bun.write(LOG_FILE, line, { append: true, createPath: false });
    }
};

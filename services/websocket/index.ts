import { MiniLogger } from "./MiniLogger";

const topic = "parking";

const server = Bun.serve({
    port: 8080,
    async fetch(req, server) {
        const url = new URL(req.url);

        // 1. WebSocket Upgrade
        if (server.upgrade(req)) {
            return; // Bun handles the 101 switch
        }

        // 2. HTTP Broadcast Endpoint
        if (req.method === "POST" && url.pathname === "/broadcast") {
            try {
                const data = await req.json();
                // Broadcast to all subscribers
                const success = server.publish(topic, JSON.stringify(data));
                MiniLogger.info(`[WS] Broadcasted message to ${success} clients: ${JSON.stringify(data)}`);
                return new Response(`Sent to ${success} clients`);
            } catch (err) {
                MiniLogger.error(String(err));
                return new Response("Invalid JSON", { status: 400 });
            }
        }

        // 3. Health Check
        if (url.pathname === "/") {
            return new Response("WebSocket Broker Running");
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            MiniLogger.info("[WS] Client connected");
            ws.subscribe(topic);
        },
        message(ws, message) {
            // Clients typically don't send messages, but we can verify auth here if needed.
        },
        close(ws) {
            MiniLogger.info("[WS] Client disconnected");
            ws.unsubscribe(topic);
        },
    },
});

MiniLogger.info(`Listening on ${server.hostname}:${server.port}`);


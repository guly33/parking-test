const topic = "parking";

const server = Bun.serve({
    port: 8080,
    fetch(req, server) {
        const url = new URL(req.url);

        // 1. WebSocket Upgrade
        if (server.upgrade(req)) {
            return; // Bun handles the 101 switch
        }

        // 2. HTTP Broadcast Endpoint
        if (req.method === "POST" && url.pathname === "/broadcast") {
            return req.json().then((data) => {
                // Broadcast to all subscribers
                const success = server.publish(topic, JSON.stringify(data));
                console.log(`[WS] Broadcasted message to ${success} clients:`, data);
                return new Response(`Sent to ${success} clients`);
            }).catch(err => {
                console.error(err);
                return new Response("Invalid JSON", { status: 400 });
            });
        }

        // 3. Health Check
        if (url.pathname === "/") {
            return new Response("WebSocket Broker Running");
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            console.log("[WS] Client connected");
            ws.subscribe(topic);
        },
        message(ws, message) {
            // Clients typically don't send messages, but we can verify auth here if needed.
        },
        close(ws) {
            console.log("[WS] Client disconnected");
            ws.unsubscribe(topic);
        },
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);

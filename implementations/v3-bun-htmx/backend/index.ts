import { AuthController } from "./src/controllers/AuthController";
import { ReservationController } from "./src/controllers/ReservationController";

console.log("Bun Native Server running on :3000 (MVC)");

const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // CORS
        if (req.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, HX-Request, HX-Current-URL, HX-Target, HX-Trigger",
                }
            });
        }

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
        };

        // 1. Serve Static Files
        // Check /app_frontend first (Docker), then ./public (Local)
        let publicDir = "/app_frontend";
        const dockerIndex = Bun.file(publicDir + "/index.html");
        if (!(await dockerIndex.exists())) {
            publicDir = "./public";
        }

        let filePath = publicDir + url.pathname;
        if (filePath.endsWith("/")) filePath += "index.html";

        const file = Bun.file(filePath);
        if (await file.exists()) {
            return new Response(file, { headers: { "Content-Type": file.type } });
        }

        // 2. API Routing
        if (url.pathname.startsWith("/api")) {
            try {
                if (url.pathname === "/api/login" && req.method === "POST") {
                    return await AuthController.login(req);
                }
                if (url.pathname === "/api/spots" && req.method === "GET") {
                    return await ReservationController.getSpots(req);
                }
                if (url.pathname === "/api/reservations" && req.method === "POST") {
                    return await ReservationController.createReservation(req);
                }
                if (url.pathname === "/api/reservations" && req.method === "DELETE") {
                    return await ReservationController.releaseReservation(req);
                }
                return new Response("Not Found", { status: 404, headers: corsHeaders });
            } catch (error) {
                console.error(error);
                return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
            }
        }

        // 3. SPA Fallback (index.html for anything else if it exists)
        // Only if not starting with /api
        const indexFile = Bun.file(publicDir + "/index.html");
        if (await indexFile.exists()) {
            return new Response(indexFile, { headers: { "Content-Type": "text/html" } });
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Listening on http://localhost:${server.port}`);

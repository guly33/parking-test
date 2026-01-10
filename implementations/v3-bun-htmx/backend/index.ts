import { AuthController } from "./src/controllers/AuthController";
import { ReservationController } from "./src/controllers/ReservationController";

console.log("Bun Native Server running on :3000 (MVC)");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // CORS Preflight
        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // Add CORS headers to all responses
        const addCors = (res: Response) => {
            Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
            return res;
        };

        // Routing
        try {
            if (req.method === "GET" && url.pathname === "/api/spots") {
                return addCors(await ReservationController.getSpots(req));
            }

            if (req.method === "POST" && url.pathname === "/api/login") {
                return addCors(await AuthController.login(req));
            }

            if (req.method === "POST" && url.pathname === "/api/reservations") {
                return addCors(await ReservationController.createReservation(req));
            }

            if (req.method === "DELETE" && url.pathname === "/api/reservations") {
                return addCors(await ReservationController.releaseReservation(req));
            }

            return addCors(new Response("Not Found", { status: 404 }));

        } catch (e: any) {
            console.error(`Root Error: ${e.message}`);
            return addCors(new Response("Internal Server Error", { status: 500 }));
        }
    },
});

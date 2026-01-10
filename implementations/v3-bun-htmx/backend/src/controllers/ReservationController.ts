import { AuthService } from "../services/AuthService";
import { WSService } from "../services/WSService";
import { SpotService } from "../services/SpotService";
import { ReservationService } from "../services/ReservationService";
import { CONFIG } from "../config";

export class ReservationController {

    // GET /api/spots
    static async getSpots(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
        const startStr = `${date} 00:00:00`;
        const endStr = `${date} 23:59:59`;

        // 1. Auth (Optional for viewing, but needed for "Release" button ownership)
        let currentUserId: number | null = null;
        try {
            const authHeader = req.headers.get("Authorization");
            if (authHeader) {
                const payload = AuthService.verifyToken(authHeader);
                currentUserId = payload.uid;
            }
        } catch (e) {
            // Ignore invalid token for view-only
        }

        try {
            // Use Services instead of direct SQL
            const spots = await SpotService.getAll();
            const reservations = await ReservationService.getActive(startStr, endStr);

            const slots = [
                { label: '08:00 - 12:00', start: 8, end: 12 },
                { label: '12:00 - 16:00', start: 12, end: 16 },
                { label: '16:00 - 20:00', start: 16, end: 20 }
            ];

            const htmlRows = spots.map(spot => {
                const cells = slots.map(slot => {
                    const res = reservations.find(r => {
                        const startObj = r.start_time instanceof Date ? r.start_time : new Date(r.start_time);
                        const endObj = r.end_time instanceof Date ? r.end_time : new Date(r.end_time);
                        return r.spot_id === spot.id && startObj.getHours() < slot.end && endObj.getHours() > slot.start;
                    });

                    const isBooked = !!res;
                    let content = `<span class="badge bg-green" style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">Available</span>`;
                    let action = `hx-post="${CONFIG.API_BASE_URL}/api/reservations" hx-vals='{"spot_id": ${spot.id}, "start": ${slot.start}, "end": ${slot.end}, "date": "${date}"}'`;
                    let cursorInfo = `cursor: pointer; opacity: 1;`;
                    let bgColor = isBooked ? '#f5f5f5' : '#e8f5e9';

                    // Time Check
                    const now = new Date(); // Use server time
                    const todayStr = now.toISOString().split('T')[0];

                    // Logic Logic Logic
                    const isToday = date === todayStr;
                    const isPastDate = date < todayStr;
                    const isPastTime = isToday && now.getHours() >= slot.start; // Strict Start Time Expiry
                    const isPast = isPastDate || isPastTime;

                    if (isPast) {
                        content = `<span style="background: #e0e0e0; color: #757575; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">Expired</span>`;
                        action = "";
                        cursorInfo = `cursor: not-allowed; opacity: 0.6;`;
                        bgColor = '#f5f5f5';
                    } else if (isBooked) {
                        if (currentUserId && res.user_id == currentUserId) {
                            content = `
                                <span style="font-size: 0.8em; font-weight: bold; display: block; margin-bottom: 4px;">Booked</span>
                                <span class="badge" style="background: white; color: #d32f2f; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; border: 1px solid #d32f2f;">Release</span>
                            `;
                            action = `hx-delete="${CONFIG.API_BASE_URL}/api/reservations?id=${res.id}"`;
                            cursorInfo = `cursor: pointer; opacity: 1; color: white;`;
                            bgColor = '#ef5350';
                        } else {
                            content = `<span class="badge bg-red" style="background: #e57373; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">Booked</span>`;
                            action = "";
                            cursorInfo = `cursor: not-allowed; opacity: 0.8;`;
                            bgColor = '#eeeeee';
                        }
                    }

                    return `
                        <td style="padding: 4px; border-bottom: 1px solid #eee;">
                            <div ${action} style="
                                ${cursorInfo} 
                                background: ${bgColor}; 
                                padding: 4px; 
                                border-radius: 4px; 
                                text-align: center;
                                display: flex;
                                flexDirection: column;
                                justifyContent: center;
                                alignItems: center;
                                height: 60px;
                            ">
                                ${content}
                            </div>
                        </td>
                    `;
                }).join("");

                return `
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px; font-weight: bold;">${spot.name}<br><small style="font-weight: normal; color: #666;">${spot.type}</small></td>
                        ${cells}
                    </tr>
                `;
            }).join("");

            return new Response(htmlRows, { headers: { "Content-Type": "text/html" } });

        } catch (e: any) {
            const err = e as Error;
            return new Response(`Error: ${err.message}`, { status: 500 });
        }
    }

    // POST /api/reservations
    static async createReservation(req: Request): Promise<Response> {
        try {
            const authHeader = req.headers.get("Authorization");
            const payload = AuthService.verifyToken(authHeader);

            let body: any = {};
            const contentType = req.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                body = await req.json();
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                // Bun's formData() returns a standard FormData object
                const formData = await req.formData();
                body = Object.fromEntries(formData);
            }

            const spot_id = body.spot_id;
            const date = body.date;
            const start = Number(body.start);
            const end = Number(body.end);

            await ReservationService.create(payload.uid, spot_id, date, start, end);

            return new Response(`<div class="p-2 text-center text-green-600 font-bold">Booked!</div>`, { headers: { "Content-Type": "text/html" } });

        } catch (e: any) {
            return new Response(`<div class="text-red-600">Error: ${e.message}</div>`, { status: 409, headers: { "Content-Type": "text/html" } });
        }
    }

    // DELETE /api/reservations
    static async releaseReservation(req: Request): Promise<Response> {
        try {
            const authHeader = req.headers.get("Authorization");
            const payload = AuthService.verifyToken(authHeader);
            const url = new URL(req.url);
            const id = url.searchParams.get("id");

            if (!id) throw new Error("Missing ID");

            await ReservationService.release(Number(id), payload.uid);

            return new Response("Released", { headers: { "Content-Type": "text/plain" } });

        } catch (e: any) {
            return new Response(`Error: ${e.message}`, { status: 409 });
        }
    }
}

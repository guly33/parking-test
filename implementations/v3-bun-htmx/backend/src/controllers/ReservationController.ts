import { AuthService } from "../services/AuthService";
import { WSService } from "../services/WSService";
import { SpotService } from "../services/SpotService";
import { ReservationService } from "../services/ReservationService";
import { CONFIG } from "../config";
import { Logger } from "../Logger";

export class ReservationController {

    // GET /api/spots
    static async getSpots(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
        const startStr = `${date} 00:00:00`;
        const endStr = `${date} 23:59:59`;
        let currentUserId: number | null = null;
        // Optional Auth: If token is present and valid, capture user ID for ownership checks.
        // If invalid or missing, proceed as guest (view-only).
        try {
            const authHeader = req.headers.get("Authorization");
            if (authHeader) {
                const payload = AuthService.verifyToken(authHeader);
                currentUserId = payload.uid;
            }
        } catch (ignored) {
            // Token invalid or expired; treat as guest.
            currentUserId = null;
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

                    // STYLES
                    const cardStyle = `
                        display: flex; 
                        flex-direction: column; 
                        justify-content: center; 
                        align-items: center; 
                        height: 70px; 
                        margin: 2px;
                        border-radius: 8px; 
                        font-family: sans-serif;
                        transition: all 0.2s;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    `;

                    // STATE: AVAILABLE
                    const isBooked = !!res;
                    let content = `<span style="color: white; font-weight: bold; font-size: 0.9em;">Available</span>`;
                    let startAction = `hx-post="${CONFIG.API_BASE_URL}/api/reservations" hx-vals='{"spot_id": ${spot.id}, "start": ${slot.start}, "end": ${slot.end}, "date": "${date}"}'`;
                    let extraStyles = `
                        background: #4caf50; 
                        cursor: pointer;
                    `;

                    // Time Check
                    const now = new Date();
                    const todayStr = now.toISOString().split('T')[0];
                    const isToday = date === todayStr;
                    const isPastDate = date < todayStr;
                    const isPastTime = isToday && now.getHours() >= slot.start;
                    const isPast = isPastDate || isPastTime;

                    if (isPast) {
                        content = `<span style="color: #9e9e9e; font-weight: bold;">Expired</span>`;
                        startAction = "";
                        extraStyles = `background: #e0e0e0; cursor: not-allowed; opacity: 0.7;`;
                    } else if (isBooked) {
                        if (currentUserId && res.user_id == currentUserId) {
                            // SELF BOOKED
                            content = `
                                <span style="color: white; font-weight: bold; font-size: 0.9em; margin-bottom: 4px;">Booked</span>
                                <button style="
                                    background: white; 
                                    color: #d32f2f; 
                                    border: none; 
                                    padding: 4px 12px; 
                                    border-radius: 4px; 
                                    font-weight: bold; 
                                    cursor: pointer;
                                    font-size: 0.75em;
                                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                                ">Release</button>
                            `;
                            startAction = `hx-delete="${CONFIG.API_BASE_URL}/api/reservations?id=${res.id}"`;
                            extraStyles = `background: #ef5350; cursor: pointer;`;
                        } else {
                            // OTHER BOOKED
                            content = `<span style="color: white; font-weight: bold; font-size: 0.9em;">Booked</span>`;
                            startAction = "";
                            extraStyles = `background: #e57373; cursor: not-allowed; opacity: 0.8;`;
                        }
                    }

                    // Hover effect via inline script? No, keep it simple V3.
                    // Just return the cell
                    return `
                        <td style="padding: 6px; border-bottom: 1px solid #f0f0f0;">
                            <div ${startAction} style="${cardStyle} ${extraStyles}">
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



            // ... inside method ...

            const spot_id = body.spot_id;
            let start_time = "";
            let end_time = "";

            if (body.date && body.start && body.end) {
                start_time = `${body.date} ${String(body.start).padStart(2, '0')}:00:00`;
                end_time = `${body.date} ${String(body.end).padStart(2, '0')}:00:00`;
            } else if (body.start_time && body.end_time) {
                start_time = body.start_time;
                end_time = body.end_time;
            } else {
                throw new Error("Missing parameters: provide (date, start, end) or (start_time, end_time)");
            }

            await ReservationService.create(payload.uid, spot_id, start_time, end_time);

            return new Response(`<div class="p-2 text-center text-green-600 font-bold">Booked!</div>`, { headers: { "Content-Type": "text/html" } });

        } catch (e: any) {
            Logger.error(`Reservation Failed: ${e.message}`);
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

    // GET /api/stats
    static async getStats(req: Request): Promise<Response> {
        try {
            const stats = await ReservationService.getStats();
            return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } });
        } catch (e: any) {
            return new Response(`Error: ${e.message}`, { status: 500 });
        }
    }
}

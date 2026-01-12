import sql from "../database";
import type { Reservation } from "../entities/Reservation";
import { WSService } from "./WSService";

export class ReservationService {
    static async getActive(startStr: string, endStr: string): Promise<Reservation[]> {
        return await sql<Reservation[]>`
            SELECT * FROM reservations 
            WHERE status = 'active' 
            AND (start_time < ${endStr} AND end_time > ${startStr})
        `;
    }

    static async create(userId: number, spotId: number, start_time: string, end_time: string): Promise<void> {

        await sql.begin(async sql => {
            // 1. Lock
            const [spot] = await sql`SELECT id FROM spots WHERE id = ${spotId} FOR UPDATE`;
            if (!spot) throw new Error("Spot not found");

            // 2. Overlap
            const [count] = await sql`
                SELECT count(*) as count FROM reservations 
                WHERE spot_id = ${spotId} 
                AND status = 'active'
                AND (start_time < ${end_time} AND end_time > ${start_time})
            `;

            if (count.count > 0) throw new Error("Conflict");

            // 3. Insert
            await sql`
                INSERT INTO reservations (spot_id, user_id, start_time, end_time, status)
                VALUES (${spotId}, ${userId}, ${start_time}, ${end_time}, 'active')
            `;
        });

        WSService.broadcastUpdate(spotId);
    }

    static async release(id: number, userId: number): Promise<number> {
        let spotId = 0;
        await sql.begin(async sql => {
            const [res] = await sql`SELECT * FROM reservations WHERE id = ${id}`;
            if (!res) throw new Error("Reservation not found");
            if (res.user_id != userId) throw new Error("Not authorized");

            spotId = res.spot_id;
            await sql`DELETE FROM reservations WHERE id = ${id}`;
        });

        if (spotId) WSService.broadcastUpdate(spotId);
        return spotId;
    }

    static async getStats(): Promise<any[]> {
        return await sql`
            SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count 
            FROM reservations 
            GROUP BY hour 
            ORDER BY count DESC
        `;
    }
}

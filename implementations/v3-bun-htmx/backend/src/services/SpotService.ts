import sql from "../database";
import type { Spot } from "../entities/Spot";

export class SpotService {
    static async getAll(): Promise<Spot[]> {
        return await sql<Spot[]>`SELECT * FROM spots ORDER BY id ASC`;
    }
}

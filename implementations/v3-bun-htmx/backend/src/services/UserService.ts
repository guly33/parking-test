import sql from "../database";
import type { User } from "../entities/User";

export class UserService {
    static async findByUsername(username: string): Promise<User | null> {
        const users = await sql<User[]>`SELECT * FROM users WHERE username = ${username}`;
        return users.length > 0 ? users[0] : null;
    }

    static async findById(id: number): Promise<User | null> {
        const users = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`;
        return users.length > 0 ? users[0] : null;
    }
}

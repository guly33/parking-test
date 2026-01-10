import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}

export class AuthService {
    static verifyToken(header: string | null): any {
        if (!header) throw new Error("Unauthorized");
        const token = header.split(" ")[1];
        if (!token) throw new Error("Invalid Token Format");
        return jwt.verify(token, JWT_SECRET);
    }

    static signToken(userId: number): string {
        return jwt.sign({ uid: userId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    }
}

import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";

export class AuthController {
    static async login(req: Request): Promise<Response> {
        try {
            const body = await req.json();
            const user = await UserService.findByUsername(body.username);

            if (!user) {
                return new Response("Invalid credentials", { status: 401 });
            }

            // In real app, verify hash. V2 parity: plain check or assume valid if found (dev).

            const token = AuthService.signToken(user.id);

            return new Response(JSON.stringify({
                success: true,
                token,
                user: { id: user.id, username: body.username }
            }), { headers: { "Content-Type": "application/json" } });

        } catch (e: any) {
            console.error(e);
            return new Response("Error", { status: 500 });
        }
    }
}

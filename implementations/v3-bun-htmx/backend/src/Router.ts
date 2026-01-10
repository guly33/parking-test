
export type Handler = (req: Request, params: Record<string, string>) => Promise<Response> | Response;

export class Router {
    private routes: { method: string; pattern: RegExp; handler: Handler; paramNames: string[] }[] = [];

    add(method: string, path: string, handler: Handler) {
        // Convert /users/{id} to regex and extract param names
        const paramNames: string[] = [];
        const regexPath = path.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
            paramNames.push(name);
            return "([^/]+)";
        });

        this.routes.push({
            method,
            pattern: new RegExp(`^${regexPath}$`),
            handler,
            paramNames
        });
    }

    async handle(req: Request): Promise<Response | null> {
        const url = new URL(req.url);

        for (const route of this.routes) {
            if (route.method !== req.method && route.method !== "ALL") continue;

            const match = url.pathname.match(route.pattern);
            if (match) {
                const params: Record<string, string> = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                return route.handler(req, params);
            }
        }
        return null;
    }
}

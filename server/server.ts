import { serve, type ServerWebSocket } from "bun";
import { Hono } from "hono";
import { apiReference } from "@scalar/hono-api-reference";
import { openAPISpecs, describeRoute } from "hono-openapi";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import log from "./log";

const httpPort = 8080;
const app = new Hono();

//  --------------------------------------------------------
//  Sockets
//  --------------------------------------------------------
type WSocket = ServerWebSocket<unknown>;
type WMessage = string | Buffer;

const clients = new Set<WSocket>();

const onConnect = (ws: WSocket) => {
    clients.add(ws);
    log.info(`User connected: ${ws.remoteAddress}. (${clients.size})`);
}

const onDisconnect = (ws: WSocket) => {
    log.info(`User disconnected: ${ws.remoteAddress}`);
    clients.delete(ws);
}

const onMessage = async (ws: WSocket, message: WMessage) => {
    log.debug(`Message recieved: ${ws.remoteAddress} ${message}`);

    for (const client of clients) {
        client.send(`Pong: ${message}`);
    }
}

//  --------------------------------------------------------
//  Web
//  --------------------------------------------------------

//  Docs and status 

const documentSuccessOrFailForType = (obj: z.AnyZodObject): any => {
    return {
        200: { description: "Success", content: { 'application/json': { schema: (zodToJsonSchema(obj) as any) } } },
        500: { description: "Error" }
    }
}

app.get('/openapi', openAPISpecs(app, {
    documentation: {
        info: { title: 'Sloppy Chat API', version: '1.0.0', description: 'Simple websocket based chat server and client' },
        servers: [{ url: `http://localhost:${httpPort}`, description: 'Local Server' }],
    },
}));

app.get('/docs', apiReference({
    theme: 'saturn',
    spec: { url: '/openapi' },
}));

//  Routes

app.onError((err, c) => {
    log.error(err);
    c.status(500);
    return c.json({ message: err.message, cause: err.cause, stack: err.stack });
});

const StatusResponse = z.object({
    clients: z.number().describe("Number of connected clients")
});

app.get("/status",
    describeRoute({
        description: "Server status",
        responses: documentSuccessOrFailForType(StatusResponse)
    }),
    async (c) => {
        log.debug("Status OK");
        const resp: z.infer<typeof StatusResponse> = {
            clients: clients.size
        };
        return c.json(resp);
    }
);

app.get('/chat/:id', async (c) => {
    const id = c.req.param("id");
    return c.json({ id: id });
});

app.get("/",
    (c) => {
        log.debug("Root page request");
        return c.html("Hello to Sloppy Chat. Click here for <a href='/docs'> API </a>.");
    }
);

//  --------------------------------------------------------
//  Server boostrap
//  --------------------------------------------------------
log.debug(`Starting server on port ${httpPort}`);

const server = serve({
    fetch: (req, server) => {
        if (req.headers.get("upgrade") === "websocket") {
            server.upgrade(req);
            return;
        }
        return app.fetch(req, server);
    },
    port: httpPort,
    websocket: {
        open(ws) { onConnect(ws) },
        close(ws) { onDisconnect(ws) },
        async message(ws, message) { await onMessage(ws, message) }
    }
});

log.info(`Server listening on ${server.url}`);
import { apiReference } from "@scalar/hono-api-reference";
import { serve, type ServerWebSocket } from "bun";
import { Hono } from "hono";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from 'valibot';
import log from "./log";
import { cli } from "winston/lib/winston/config";

const httpPort = 8080;
const app = new Hono();

interface ChatMessage {
    from: string;
    message: string;
}

//  --------------------------------------------------------
//  Sockets
//  --------------------------------------------------------
type WSocket = ServerWebSocket<unknown>;
type WMessage = string | Buffer;

interface ChatUser {
    id: string;
    name: string;
    socket: WSocket;
}

const clients = new Map<string, ChatUser>();

const onConnect = (ws: WSocket) => {
    const id = crypto.randomUUID();
    const cu: ChatUser = {
        id: id,
        name: `slop${id.substring(0, 6)}`,
        socket: ws
    };
    clients.set(id, cu);
    log.info(`User connected: ${cu.name}. (${clients.size})`);
}

const onDisconnect = (ws: WSocket) => {
    for (const { id, name, socket } of clients.values()) {
        if (socket === ws) {
            log.info(`User disconnected: ${name} (${clients.size})`);
            clients.delete(id);
        }
    }
}

const onMessage = async (ws: WSocket, message: WMessage) => {
    let fromName: string;
    for (const { id, name, socket } of clients.values()) {
        if (ws === socket) {
            fromName = clients.get(id)!.name;
            log.debug(`${name} sent "${message}"`);
        }
    }

    const rp: ChatMessage = {
        from: fromName!,
        message: `${message}`
    }

    for (const { socket } of clients.values()) {
        socket.send(JSON.stringify(rp));
    }
}

//  --------------------------------------------------------
//  Web
//  --------------------------------------------------------

//  Docs and status 

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

const StatusResponse = v.object({
    clients: v.number()
})

app.get("/status",
    describeRoute({
        description: "Server status",
        responses: {
            200: { description: "Success", content: { 'application/json': { schema: resolver(StatusResponse) } } }
        }
    }),
    async (c) => {
        return c.json({
            clients: clients.size
        });
    }
);

const ChatInfoRequest = v.object({
    id: v.string()
});

const ChatInfoResponse = v.object({
    id: v.string()
});

app.get('/chat/:id',
    describeRoute({
        description: "Returns info about the chat ID",
        responses: {
            200: { description: "Success", content: { 'application/json': { schema: resolver(ChatInfoResponse) } } }
        }
    }),
    validator('param', ChatInfoRequest),
    async (c) => {
        const id = c.req.param("id");

        return c.json({
            id: id
        });
    }
);

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
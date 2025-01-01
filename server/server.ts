import { apiReference } from "@scalar/hono-api-reference";
import { serve, type ServerWebSocket } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from 'valibot';
import log from "./log";
import { MessageType } from "./types";
import type {
    ChatMessage, ChatMessageRequest, ChatUserConnectedAck,
    ChatUserCreateSession, ChatUserNameChangeAck, ChatUserNameChange, ChatUserCreateSessionAck
} from "./types";

//  set in .env file, used for admin routes
const adminPassword = process.env.CHAT_ADMIN_KEY;

const httpPort = 8080;
const app = new Hono();

//  --------------------------------------------------------
//  Sockets
//  --------------------------------------------------------
export type WSocket = ServerWebSocket<unknown>;
export type WMessage = string | Buffer;

export interface ChatUser {
    userId: string;
    name: string;
    socket: WSocket;
}

const clients = new Map<string, ChatUser>();

const onConnect = (ws: WSocket) => {
    const id = crypto.randomUUID();

    log.info(`User connected: ${id} (${ws.remoteAddress})`);

    //  We generate info about user and pass it to them - they will re-send their old IDs if they are reconnecting
    const cr: ChatUserConnectedAck = {
        type: MessageType.ACK,
        userId: id,
    }
    ws.send(JSON.stringify(cr));
}

const onDisconnect = (ws: WSocket) => {
    for (const { userId: id, name, socket } of clients.values()) {
        if (socket === ws) {
            log.info(`User disconnected: ${name} (${clients.size})`);
            clients.delete(id);
        }
    }
}

const onMessage = async (ws: WSocket, message: WMessage) => {
    const request = JSON.parse(message.toString());
    const type: MessageType = request['type'];

    //  User connected - create session
    if (type === MessageType.SESSION_CREATE) {
        const req = request as ChatUserCreateSession;

        log.info(`User ${req.desiredName} session created with ID ${req.userId} (${clients.size + 1})`);

        const cu: ChatUser = {
            userId: req.userId,
            name: req.desiredName,
            socket: ws
        };
        clients.set(req.userId, cu);

        //  Acknowledge session creation
        const sr: ChatUserCreateSessionAck = {
            type: MessageType.SESSION_RESP
        }
        ws.send(JSON.stringify(sr));
    }

    //  New chat message
    if (type === MessageType.MSG_REQUEST) {
        const req = request as ChatMessageRequest;
        const sentBy = clients.get(req.userId);

        if (!sentBy) {
            log.warn("Recieved payload from unknown user");
            return;
        }

        log.debug(`-> ${sentBy.name} ${req.message}`);

        const rp: ChatMessage = {
            type: MessageType.MSG_RESPONSE,
            userName: sentBy.name,
            message: req.message
        }

        //  Broadcast to all
        for (const { userId, socket } of clients.values()) {
            if (req.userId !== userId) // don't send back to itself
                socket.send(JSON.stringify(rp));
        }
    }

    //  User name change
    if (type === MessageType.NAME_CHANGE) {
        const req = request as ChatUserNameChange;
        const user = clients.get(req.userId);

        if (!user) {
            log.warn("Recieved name change request from unknown user");
            return;
        }

        log.debug(`User ${user?.name} changed name to ${req.newName}`);
        user.name = req.newName;
        clients.set(req.userId, user);

        const ack : ChatUserNameChangeAck = {
            type: MessageType.NAME_CHANGE_ACK,
            success: true,
            newName: req.newName
        }
        ws.send(JSON.stringify(ack));
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
});

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

const ChatKickRequest = v.object({
    userId: v.optional(v.string()),
    name: v.string()
});

const ChatKickResponse = v.object({
    success: v.boolean(),
});

app.get('/chat/kick',
    describeRoute({
        description: "Kicks the user out of the chat",
        responses: {
            200: { description: "Success", content: { 'application/json': { schema: resolver(ChatKickResponse) } } }
        }
    }),
    validator('query', ChatKickRequest),
    async (c) => {
        const id = c.req.query("id");
        const name = c.req.query("name");

        log.info(`Kicking user ${name} with id ${id}`);

        return c.json({
            success: true
        });
    }
);

const ChatBanIpRequest = v.object({
    ip: v.string(),
});

app.get("/chat/ban",
    describeRoute({
        description: "Bans an IP address",
        responses: {
            200: { description: "Success", content: { 'application/json': { schema: resolver(ChatKickResponse) } } }
        }
    }),
    validator('query', ChatBanIpRequest),
    async (c) => {
        const ip = c.req.query("ip");
        log.info(`Banning IP ${ip}`);

        return c.json({
            success: true
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
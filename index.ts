import { serve, type ServerWebSocket } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
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
    log.info(`User connected: ${ws.remoteAddress}`);
    clients.add(ws);
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

const readFile = async (path: string): Promise<string | null> => {
    try {
        const file = await Bun.file(path).text();
        return file;
    } catch (err) {
        log.error(`Error reading file: ${path}`, err);
        return null;
    }
}

app.onError((err, c) => {
    log.error(err);
    c.status(500);
    return c.json({ message: err.message, cause: err.cause, stack: err.stack });
});

app.get("/status", async (c) => {
    log.debug("Status OK");
    return c.json({ 
        status: "OK",
        clients: clients.size 
    });
});

app.get('/chat/:id', async (c) => {
    const id = c.req.param("id");
    return c.json({ id: id });
});

app.get("/", (c) => {
    log.debug("Root page request");
    return c.text("Hello to Sloppy Chat");
});

app.use("/client/test", serveStatic({
    root: "./public",
    getContent: (p, c) => readFile("./public/test_client.html")
}));

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
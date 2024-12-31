import { serve } from "bun";
import { Hono } from "hono";
import log from "./log";

const httpPort = 8080;

const app = new Hono();

app.onError((err, c) => {
    log.error(err);
    c.status(500);
    return c.json({ message: err.message, cause: err.cause, stack: err.stack });
});

app.get("/status", async (c) => {
    log.debug("Status OK");
    return c.json({ status: "OK" });
});

app.get('/chat/:id', async (c) => {
    const id = c.req.param("id");
    return c.json({ id: id });
})

app.get("/", (c) => {
    log.info("New user");
    return c.text("Hello test");
});

log.debug(`Starting server on port ${httpPort}`);

const server = serve({ fetch: app.fetch, port: httpPort })

log.info(`Server listening on ${server.url}`);

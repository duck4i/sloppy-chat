import { app, bots, startServer, createLogger, type BotProcessReturn, type BotReply } from "@duck4i/sloppy-chat-server";
const log = createLogger();

const addBot = () => {
    const examplePingBot = async (message: string, userName: string, userId: string): BotProcessReturn => {
        if (message === "!ping") {
            const rp: BotReply = {
                botName: "~SloppyPong~",
                message: "Pong!",
                onlyToSender: false
            };
            return rp;
        }
        return null;
    }
    bots.push(examplePingBot);
    log.info("Bot created");
}

addBot();

const extendRoutes = () => {
    const outDir = `${import.meta.dir}/build`;

    const compile = async () => {
        log.info(`Compiling react page...`);

        const res = await Bun.build({
            entrypoints: [`${import.meta.dir}/client.tsx`],
            outdir: outDir,
            minify: true,
            target: "browser"
        });

        if (res.logs.length > 0)
            log.warn(res.logs);
        
        res.outputs?.map((info) => {
            log.debug(`Compiled: ${info.path}`)
        })
        log.info("React compile completed.");
    }

    compile().then(() => {
        const jsRoute = "/chat/client.js";
        app.get(jsRoute, async c => {
            const file = Bun.file(`${outDir}/client.js`);
            return c.text(await file.text(), 200, {
                "Content-Type": "application/javascript"
            });
        });

        app.get("/chat",
            async c => {
                return c.html(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sloppy Chat App</title>
                </head>
                <body>
                    <div id="app"></div>
                    <script type="module" src="${jsRoute}"></script>
                </body>
                </html>
            `);
            }
        );
    })
}
extendRoutes();

const server = startServer({
    port: 8080
});
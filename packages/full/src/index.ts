import { app, bots, startServer, createLogger, type BotProcessReturn, type BotReply, type ServerParams } from "@duck4i/sloppy-chat-server";
import type { ChatProps } from "./chat";

const startServerWithUI = (options?: ServerParams) => {
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

        const anotherOne = async (message: string, userName: string, userId: string): BotProcessReturn => {
            if (message == "!bot"){
                return {
                    botName: "TEST",
                    message: "K",
                    onlyToSender: false
                }
            }
            return null;
        }
        bots.push(anotherOne);

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

            const buildHtml = (url: string) => {
                const props : ChatProps = {
                    url: url
                };
                return `
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
                    <script>
                        window.__INITIAL_PROPS__ = ${JSON.stringify(props)}
                    </script>
                    </html>
                `
            }

            app.get("/",
                async c => {
                    const host = c.req.header("Host")?.toString();
                    console.log("HOST", host);
                    return c.html(buildHtml(host!));
                }
            );
        })
    }
    extendRoutes();

    return startServer(options);
}

export * from "@duck4i/sloppy-chat-server";

export {
    startServerWithUI,
}
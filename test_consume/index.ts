import { App, Bots, startServer, type BotProcessReturn, type BotReply } from "@duck4i/sloppy-chat";
import type { ServerWebSocket } from "bun";

const addBot = () => {
    const examplePingBot = async (ws: ServerWebSocket<unknown>, message: string, userName: string, userId: string): BotProcessReturn => {
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
    Bots.push(examplePingBot);
}

const extendRoutes = () => {
    App.get("/new-route",
        async c => {
            return c.json({
                success: true
            })
        }
    );
}

addBot();
extendRoutes();

const server = startServer();
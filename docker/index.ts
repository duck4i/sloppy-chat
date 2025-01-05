import { bots, startServer, type BotProcessReturn, type BotReply } from "@duck4i/sloppy-chat-server";
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
    bots.push(examplePingBot);
}

addBot();

const server = startServer();
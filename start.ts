import { app, bots, startServer } from "@duck4i/sloppy-chat-server";
import type { BotProcessFunction, BotProcessReturn, BotReply} from "@duck4i/sloppy-chat-server";

import type { ServerWebSocket } from "bun";

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

const server = startServer();
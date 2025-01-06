import { bots, startServerWithUI, type BotProcessReturn, type BotReply } from "@duck4i/sloppy-chat-full";
import type { ServerWebSocket } from "bun";

const addBot = () => {
    const examplePingBot = async (message: string, userName: string, userId: string): BotProcessReturn => {
        if (message === "!slop") {
            const rp: BotReply = {
                botName: "~SloppyPong~",
                message: "SLOOOP!",
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
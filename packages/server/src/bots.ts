//  This is to process the bot messages
import { type ServerWebSocket } from "bun";

export interface BotReply {
    botName: string;
    message: string;
    onlyToSender: boolean;
}

export type BotProcessReturn = Promise<BotReply | null>;
export type BotProcessFunction = (ws: ServerWebSocket<unknown>, message: string, userName: string, userId: string) => BotProcessReturn;


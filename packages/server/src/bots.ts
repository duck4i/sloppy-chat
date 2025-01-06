export interface BotReply {
    botName: string;
    message: string;
    onlyToSender: boolean;
}

export type BotProcessReturn = Promise<BotReply | null>;
export type BotProcessFunction = (message: string, userName: string, userId: string) => BotProcessReturn;

import { app, bots, startServer } from "./server/server";
import { Client, type OnConnected, type OnDisconnected, type OnChatRecieved, type OnNameChange } from "./client/client";
import type { BotProcessFunction, BotProcessReturn, BotReply } from "./server/bots";

export {
    app as App,
    bots as Bots,
    startServer,

    Client,
    type OnConnected,
    type OnDisconnected,
    type OnChatRecieved,
    type OnNameChange,

    type BotProcessFunction,
    type BotProcessReturn,
    type BotReply
}
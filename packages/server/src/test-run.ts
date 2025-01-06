import { app, bots, startServer, type BotProcessReturn, type BotReply } from "./index";

const addBot = () => {
    const examplePingBot = async ( message: string, userName: string, userId: string): BotProcessReturn => {
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

const extendRoutes = () => {
    app.get("/new-route",
        async c => {
            return c.json({
                success: true
            })
        }
    );
}

addBot();
extendRoutes();

const server = startServer({
    port: 8090
});
# sloppy-chat

This is a modern and performant chat server and client system, originally made for Slopify.dev.

Its super simple and designed to be as accessible for editing by community but still providing basic security features:
- No chat user name duplication
- Rate limiting and spam prevention 
- Server API for kicking users and banning IPs (with UI for docs)
- Bots creation by extending `!command` message format. 

Server and client can be used trough the provided docker image or consumed in another Bun application.

# Docker 

There is published Docker image for the server in case you need it. This project provides a docker-compose setup too.

https://hub.docker.com/r/duck4i/sloppy-chat

Environment variables:
* CHAT_SERVER_PORT - port server listens on (defaults to 8080)
* CHAT_SERVER_URL - URL of server without port (defaults to http://localhost) 
* CHAT_ADMIN_KEY - key string used for server operations like removing users

# NPM 

You can consume both client and server inside your own apps.

## Server usage

```
bun install @duck4i/sloppy-chat-server
```

```typescript

import { App, Bots, startServer, type BotProcessReturn, type BotReply } from "@duck4i/sloppy-chat-server";

//  Optional bot creation
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
Bots.push(examplePingBot);

const server = startServer(/*{options}*/);

//  ... server will now be running 

```

## Client 

```
bun install @duck4i/sloppy-chat-client
```

```typescript

import { Client } from "@duck4i/sloppy-chat-client";

const chatClient = new Client("ws://localhost:8080");
chatClient.connect();

//  Actions
chatClient.send(message);
chatClient.changeName(name);

//  Callbacks
chatClient.onConnected((name) => {
    console.log("CLIENT - got name", name);
});

chatClient.onDisconnected(() => {
    console.log("CLIENT - close");
});

chatClient.onMessage((from, text, type /* 1 - Bot | 0 - User */) => {
    console.log(`CLIENT message ${from}: ${text}`);
});

chatClient.onNameChange((name, success) => {
    console.log(`CLIENT name change ${name}: ${success}`);
});

```

# API

The API comes with docs UI for testing, you can set the server URL via the `CHAT_SERVER_URL` env variable.

* Main route shows welcome with API link at http://localhost:8080/
* API Docs UI http://localhost:8080/docs (use this to kick users out)

Status route shows the count of connected users.

## Admin authentication 

Server API that requires admin permissions simply requests user key (pass) as set by `CHAT_ADMIN_KEY` variable.
This is usually done in `.env` file.

# Development 

# Usage 

To install dependencies:

```bash
pnpm install
pnpm -r build
```

To run test server navigate to the packages/server/src:

```bash
bun run test-run.ts
```

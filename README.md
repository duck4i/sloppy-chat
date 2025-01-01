# sloppy-chat

This is made for Slopify.dev, a super simple bun driven chat server and client designed to be as accessible for editing by community but still providing basic security features:
- No chat user name duplication
- Rate limiting and spam prevention 
- Server API for kicking users and banning IPs 

The server comes with the UI to trigger paths.

# Admin authentication 

Server API that requires admin permissions simply requests user key (pass) as set by `CHAT_ADMIN_KEY` variable.
This is usually done in `.env` file.

# API

* Main route shows welcome with API link at http://localhost:8080/
* API Docs http://localhost:8080/docs
  
# Usage 

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run server/server.ts
```

To generate JS client to use in HTML pages
```bash
 bun build ./client/client.ts --outfile  ./client/client.js
```
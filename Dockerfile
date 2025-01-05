FROM oven/bun:latest

WORKDIR /
COPY . .

RUN bun install

ENV CHAT_ANON_PREFIX=""
ENV CHAT_ADMIN_KEY="your_admin_key"
ENV CHAT_SERVER_PORT=8080
ENV CHAT_SERVER_URL="http://localhost"

EXPOSE $CHAT_SERVER_PORT

CMD ["bun", "run", "./server/server.ts"]
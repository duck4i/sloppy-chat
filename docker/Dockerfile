FROM oven/bun:latest

WORKDIR /
COPY . .

ENV CHAT_ADMIN_KEY="your_admin_key"
ENV CHAT_SERVER_PORT=8080
ENV CHAT_SERVER_URL="http://localhost"

EXPOSE $CHAT_SERVER_PORT

RUN bun install

CMD ["bun", "start"]
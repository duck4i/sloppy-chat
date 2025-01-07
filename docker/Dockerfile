FROM oven/bun:latest

WORKDIR /
COPY . .

RUN apt-get update 
RUN apt-get install -y build-essential cmake g++ 

ENV CHAT_ADMIN_KEY="your_admin_key"
ENV CHAT_SERVER_PORT=8080
ENV CHAT_SERVER_URL="http://localhost"

EXPOSE $CHAT_SERVER_PORT

RUN bun install

CMD ["bun", "start"]
// client/client.ts
class Client {
  server;
  socket = null;
  reconnectInterval = 1000;
  reconnectHandle = null;
  userId = null;
  userName = null;
  state = 0 /* Disconnected */;
  constructor(server) {
    this.server = server;
  }
  connect(isReconnect = false) {
    this.socket = new WebSocket(this.server);
    this.state = isReconnect ? 3 /* Reconnecting */ : 2 /* Connecting */;
    this.socket.onopen = (ev) => {
      this.state = 1 /* Connected */;
      console.info("Server connection established.");
    };
    this.socket.onclose = (ev) => {
      if (this.state === 1 /* Connected */ && this.disconnectedCallback) {
        console.warn("Server connection lost.");
        this.disconnectedCallback();
      }
      this.state = 0 /* Disconnected */;
      if (this.reconnectHandle)
        clearTimeout(this.reconnectHandle);
      this.reconnectHandle = setTimeout(() => {
        this.connect(true);
      }, this.reconnectInterval);
    };
    this.socket.onerror = (error) => {
      error.preventDefault();
      if (this.state !== 3 /* Reconnecting */ && this.state !== 2 /* Connecting */)
        console.error("Connection error", error, this.state);
    };
    this.socket.onmessage = async (ev) => {
      const data = JSON.parse(ev.data);
      const type = data["type"];
      if (type === "ACK" /* ACK */) {
        const ack = data;
        console.debug("Recieved ACK message on connect with name", ack.generatedName);
        this.userId = ack.userId;
        this.userName = ack.generatedName;
        if (this.connectedCallback) {
          this.connectedCallback(this.userName);
        }
        return;
      }
      if (type === "RESP" /* RESPONSE */) {
        const msg = data;
        console.debug("Chat message recieved from.", msg.userName);
        if (this.messageCallback) {
        }
        return;
      }
    };
  }
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.state = 0 /* Disconnected */;
    }
  }
  send(message) {
    if (this.state !== 1 /* Connected */ || !this.socket) {
      console.warn("Sending message while client disconnected.");
      return;
    }
    const pr = {
      type: "REQ" /* REQUEST */,
      userId: this.userId,
      message
    };
    this.socket.send(JSON.stringify(pr));
  }
  messageCallback = null;
  connectedCallback = null;
  disconnectedCallback = null;
  onConnected(callback) {
    this.connectedCallback = callback;
  }
  onDisconnected(callback) {
    this.disconnectedCallback = callback;
  }
  onMessage(callback) {
    this.messageCallback = callback;
  }
}
var localhostClient = new Client("ws://localhost:8080");

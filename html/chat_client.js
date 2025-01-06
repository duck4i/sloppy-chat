// packages/common/dist/messages.js
var MessageType;
(function(MessageType2) {
  MessageType2["ACK"] = "ACK";
  MessageType2["SESSION_CREATE"] = "SRC";
  MessageType2["SESSION_ACK"] = "SRP";
  MessageType2["MSG_REQUEST"] = "REQ";
  MessageType2["MSG_RESPONSE"] = "RESP";
  MessageType2["NAME_CHANGE"] = "NAME";
  MessageType2["NAME_CHANGE_ACK"] = "NACK";
  MessageType2["USER_KICK"] = "KICK";
  MessageType2["RATE_LIMIT"] = "RATE";
})(MessageType || (MessageType = {}));
var MessageUserType;
(function(MessageUserType2) {
  MessageUserType2[MessageUserType2["User"] = 0] = "User";
  MessageUserType2[MessageUserType2["Bot"] = 1] = "Bot";
})(MessageUserType || (MessageUserType = {}));
// packages/client/dist/client.js
var USER_NAME_STORAGE_ID = "sloppychat-username";
var ClientState;
(function(ClientState2) {
  ClientState2[ClientState2["Disconnected"] = 0] = "Disconnected";
  ClientState2[ClientState2["Connected"] = 1] = "Connected";
  ClientState2[ClientState2["InSession"] = 2] = "InSession";
  ClientState2[ClientState2["Connecting"] = 3] = "Connecting";
  ClientState2[ClientState2["Reconnecting"] = 4] = "Reconnecting";
})(ClientState || (ClientState = {}));

class Client {
  server;
  socket = null;
  reconnectInterval = 1000;
  reconnectHandle = null;
  userId = null;
  userName = null;
  state = ClientState.Disconnected;
  constructor(server) {
    this.server = server;
    this.userName = localStorage.getItem(USER_NAME_STORAGE_ID) || null;
  }
  connect() {
    this._connect(false);
  }
  _connect(isReconnect = false) {
    this.socket = new WebSocket(this.server);
    this.state = isReconnect ? ClientState.Reconnecting : ClientState.Connecting;
    this.socket.onopen = (ev) => {
      this.state = ClientState.Connected;
      console.info("Server connection established.");
    };
    this.socket.onclose = (ev) => {
      if ((this.state === ClientState.Connected || this.state === ClientState.InSession) && this.disconnectedCallback) {
        console.warn("Server connection lost.");
        this.disconnectedCallback();
      }
      this.state = ClientState.Disconnected;
      if (this.reconnectHandle)
        clearTimeout(this.reconnectHandle);
      this.reconnectHandle = setTimeout(() => {
        this._connect(true);
      }, this.reconnectInterval);
    };
    this.socket.onerror = (error) => {
      error.preventDefault();
      if (this.state !== ClientState.Reconnecting && this.state !== ClientState.Connecting)
        console.error(`Connection error, ${error}, ${this.state}`);
    };
    this.socket.onmessage = async (ev) => {
      const data = JSON.parse(ev.data);
      const type = data["type"];
      if (type === MessageType.ACK) {
        const ack = data;
        console.debug(`Recieved ACK message on connect with ID ${ack.userId}`);
        this.userId = ack.userId;
        if (!this.userName) {
          this.userName = `slop-${this.userId.substring(0, 6)}`;
          localStorage.setItem(USER_NAME_STORAGE_ID, this.userName);
        }
        const sr = {
          type: MessageType.SESSION_CREATE,
          userId: this.userId,
          desiredName: this.userName
        };
        this.socket.send(JSON.stringify(sr));
        return;
      }
      if (type === MessageType.SESSION_ACK) {
        this.state = ClientState.InSession;
        if (this.connectedCallback) {
          this.connectedCallback(this.userName);
        }
      }
      if (type === MessageType.MSG_RESPONSE) {
        const msg = data;
        console.debug(`Chat message recieved from. ${msg.userName}`);
        if (this.messageCallback) {
          this.messageCallback(msg.userName, msg.message, msg.userType);
        }
        return;
      }
      if (type === MessageType.NAME_CHANGE_ACK) {
        const res = data;
        if (res.success) {
          this.userName = res.newName;
          localStorage.setItem(USER_NAME_STORAGE_ID, this.userName);
        }
        if (this.nameChangeCallback) {
          this.nameChangeCallback(res.newName, res.success);
        }
      }
    };
  }
  disconnect() {
    console.info("Disconnect called.");
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.state = ClientState.Disconnected;
      console.debug(`Disconnect completed.`);
    }
  }
  send(message) {
    if (this.state !== ClientState.InSession || !this.socket) {
      console.warn("Sending message without client session.");
      return false;
    }
    const pr = {
      type: MessageType.MSG_REQUEST,
      userId: this.userId,
      message
    };
    this.socket.send(JSON.stringify(pr));
    return true;
  }
  changeName(newName) {
    if (this.state !== ClientState.InSession || !this.socket) {
      console.warn("Trying to change name without session.");
      return false;
    }
    if (newName?.length < 3) {
      console.warn("Name too short.");
      return false;
    }
    const nc = {
      type: MessageType.NAME_CHANGE,
      userId: this.userId,
      newName
    };
    this.socket.send(JSON.stringify(nc));
    return true;
  }
  messageCallback = null;
  connectedCallback = null;
  disconnectedCallback = null;
  nameChangeCallback = null;
  onConnected(callback) {
    this.connectedCallback = callback;
  }
  onDisconnected(callback) {
    this.disconnectedCallback = callback;
  }
  onMessage(callback) {
    this.messageCallback = callback;
  }
  onNameChange(callback) {
    this.nameChangeCallback = callback;
  }
}
// html/chat_client.ts
var localhostClient = new Client("ws://localhost:8080");

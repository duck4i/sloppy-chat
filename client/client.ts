import type { ChatMessage, ChatMessageRequest, ChatUserAck } from "../server/types";
import { MessageType } from "../server/types";

export type OnChatRecieved = (from: string, message: string) => void;
export type OnConnected = (username: string) => void;
export type OnDisconnected = () => void;

enum ClientState { Disconnected, Connected, Connecting, Reconnecting }

class Client {
    server: string;
    socket: WebSocket | null = null;

    reconnectInterval: number = 1000;
    reconnectHandle: Timer | null = null;

    userId: string | null = null;
    userName: string | null = null;

    state: ClientState = ClientState.Disconnected;

    constructor(server: string) {
        this.server = server;
    }

    connect(isReconnect: boolean = false) {

        this.socket = new WebSocket(this.server); // triggers connection
        this.state = isReconnect ? ClientState.Reconnecting : ClientState.Connecting;

        this.socket.onopen = (ev) => {
            this.state = ClientState.Connected;
            console.info("Server connection established.");
        }

        this.socket.onclose = (ev) => {
            if (this.state === ClientState.Connected && this.disconnectedCallback) {
                console.warn("Server connection lost.");
                this.disconnectedCallback();
            }

            this.state = ClientState.Disconnected;
            
            //  Reconnect
            if (this.reconnectHandle)
                clearTimeout(this.reconnectHandle);

            this.reconnectHandle = setTimeout(() => {
                this.connect(true);
            }, this.reconnectInterval);
        }

        this.socket.onerror = (error) => {
            error.preventDefault();
            if (this.state !== ClientState.Reconnecting && this.state !== ClientState.Connecting)
                console.error("Connection error", error, this.state);
        }

        this.socket.onmessage = async (ev) => {
            const data = JSON.parse(ev.data);
            const type: MessageType = data['type'];

            if (type === MessageType.ACK) {
                const ack = data as ChatUserAck;
                console.debug("Recieved ACK message on connect with name", ack.generatedName);
                this.userId = ack.userId;
                this.userName = ack.generatedName;

                if (this.connectedCallback) {
                    this.connectedCallback(this.userName);
                }
                return;
            }

            if (type === MessageType.RESPONSE) {
                const msg = data as ChatMessage;
                console.debug("Chat message recieved from.", msg.userName);
                
                if (this.messageCallback) {
                    this.messageCallback(msg.userName, msg.message);
                }
                return;
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.state = ClientState.Disconnected;
        }
    }

    send(message: string) {
        if (this.state !== ClientState.Connected || !this.socket) {
            console.warn("Sending message while client disconnected.");
            return;
        }
        const pr: ChatMessageRequest = {
            type: MessageType.REQUEST,
            userId: this.userId!,
            message: message
        }
        this.socket.send(JSON.stringify(pr));
    }

    //  Callbacks

    private messageCallback: OnChatRecieved | null = null;
    private connectedCallback: OnConnected | null = null;
    private disconnectedCallback: OnDisconnected | null = null;

    onConnected(callback: OnConnected) {
        this.connectedCallback = callback;
    }

    onDisconnected(callback: OnDisconnected) {
        this.disconnectedCallback = callback;
    }

    onMessage(callback: OnChatRecieved) {
        this.messageCallback = callback;
    }
}

const localhostClient = new Client("ws://localhost:8080");
import { useState } from "react";
import { Client } from "@duck4i/sloppy-chat-client";
import type { MessageUserType } from "@duck4i/sloppy-chat-common";

interface Message {
    from: string;
    message: string;
    userType: MessageUserType;
}

export default function Chat() {

    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const [name, setName] = useState("");

    const client = new Client("ws://localhost:8080");
    client.onConnected(() => {
        setConnected(true);
    });

    client.onDisconnected(() => {
        setConnected(false);
    });

    client.onNameChange((name: string, success: boolean) => {
        if (success) {
            setName(name);
        }
    });

    client.onMessage((from: string, message: string, userType: MessageUserType) => {
        const m = messages;
        m.push({
            from: from,
            message: message,
            userType: userType
        });
        setMessages(m);
    })

    return (
        <div>
            <h1> {connected ? 'Connected' : 'Disconnected'} </h1>
            <p>Hello there {name}! </p>

            {false && <button onClick={() => setConnected(!connected)}>
                Toggle Connection
            </button>}
        </div>
    );
}

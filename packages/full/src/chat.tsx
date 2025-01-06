import { useEffect, useState, useMemo } from "react";
import { Client } from "@duck4i/sloppy-chat-client";
import { MessageUserType } from "@duck4i/sloppy-chat-common";

interface Message {
    from: string;
    message: string;
    userType: MessageUserType | "self";
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const [name, setName] = useState("");
    const [inputMessage, setInputMessage] = useState("");
    const [nameInput, setNameInput] = useState("");

    const client = useMemo(() => new Client("ws://localhost:8080"), []);

    useEffect(() => {
        client.onConnected(() => {
            console.log("Connected.");
            setConnected(true);
        });

        client.onDisconnected(() => {
            console.log("Disconnected.");
            setConnected(false);
        });

        client.onNameChange((name: string, success: boolean) => {
            console.log(`${name} change ${success}`);
            if (success) {
                setName(name);
                setNameInput("");
            }
        });

        client.onMessage((from: string, message: string, userType: MessageUserType) => {
            setMessages(prev => [...prev, { from, message, userType }]);
        });

        client.connect();
        return () => client.disconnect();
    }, [client]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            client.send(inputMessage);
            // Add the message locally since onMessage won't fire for our own messages
            setMessages(prev => [...prev, {
                from: name,
                message: inputMessage,
                userType: "self"
            }]);
            setInputMessage("");
        }
    };

    const handleSetName = (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim()) {
            client.changeName(nameInput);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1>Chat {connected ? '(Connected)' : '(Disconnected)'}</h1>
                {!name ? (
                    <form onSubmit={handleSetName}>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Enter your name"
                        />
                        <button type="submit">Set Name</button>
                    </form>
                ) : (
                    <p>Hello, {name}!</p>
                )}
            </div>

            <div style={{
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                marginBottom: '20px'
            }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            marginBottom: '10px',
                            textAlign: msg.userType === 'self' ? 'right' : 'left'
                        }}
                    >
                        <div style={{
                            display: 'inline-block',
                            background: msg.userType === 'self' ? '#e3f2fd' : msg.userType === MessageUserType.User ? '#f5f5f5' : `#c3f1ba`,
                            padding: '8px',
                            borderRadius: '5px',
                            maxWidth: '80%'
                        }}>
                            <div style={{ fontSize: '0.8em', marginBottom: '4px' }}>{msg.from}</div>
                            <div>{msg.message}</div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!connected || !name}
                    style={{ width: '80%', marginRight: '10px' }}
                />
                <button
                    type="submit"
                    disabled={!connected || !name}
                >
                    Send
                </button>
            </form>
        </div>
    );
}
import { useEffect, useState, useMemo, useRef } from "react";
import { Client } from "@duck4i/sloppy-chat-client";
import { MessageUserType } from "@duck4i/sloppy-chat-common";
import { Moon, Sun } from "lucide-react";

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
    const [isChangingName, setIsChangingName] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const client = useMemo(() => new Client("ws://localhost:8080"), []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        // Apply dark mode to the entire document
        document.documentElement.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
        document.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
        document.documentElement.style.color = isDarkMode ? '#ffffff' : '#000000';
        document.body.style.color = isDarkMode ? '#ffffff' : '#000000';
        document.body.style.margin = '0';
        document.body.style.minHeight = '100vh';
    }, [isDarkMode]);

    useEffect(() => {
        client.onConnected((name) => {
            console.log("Connected.");
            setConnected(true);
            setName(name);
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
                setIsChangingName(false);
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

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                padding: '20px',
                maxWidth: '600px',
                margin: '0 auto',
            }}>
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1>Chat {connected ? '(Connected)' : '(Disconnected)'}</h1>
                    <button
                        onClick={toggleDarkMode}
                        style={{
                            padding: '8px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isDarkMode ? <Sun size={20} color="#fff" /> : <Moon size={20} color="#000" />}
                    </button>
                </div>

                <div style={{ gap: 20 }}>
                    <a href="/docs" style={{ color: isDarkMode ? '#66b3ff' : '#0066cc' }}>
                        Click here for API docs
                    </a>
                </div>

                <div style={{ marginTop: '20px' }}>
                    {/* Rest of the component remains the same */}
                    {!name ? (
                        <form onSubmit={handleSetName}>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Enter your name"
                                style={{
                                    backgroundColor: isDarkMode ? '#333' : '#fff',
                                    color: isDarkMode ? '#fff' : '#000',
                                    border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                                    padding: '8px'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
                                    color: isDarkMode ? '#fff' : '#000',
                                    border: 'none',
                                    padding: '8px 16px',
                                    marginLeft: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Set Name
                            </button>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isChangingName ? (
                                <form onSubmit={handleSetName} style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        placeholder="Enter new name"
                                        style={{
                                            backgroundColor: isDarkMode ? '#333' : '#fff',
                                            color: isDarkMode ? '#fff' : '#000',
                                            border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                                            padding: '8px'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
                                            color: isDarkMode ? '#fff' : '#000',
                                            border: 'none',
                                            padding: '8px 16px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Update Name
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsChangingName(false);
                                            setNameInput("");
                                        }}
                                        style={{
                                            backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
                                            color: isDarkMode ? '#fff' : '#000',
                                            border: 'none',
                                            padding: '8px 16px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <p>Hello, {name}!</p>
                                    <button
                                        onClick={() => setIsChangingName(true)}
                                        style={{
                                            backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
                                            color: isDarkMode ? '#fff' : '#000',
                                            border: 'none',
                                            padding: '8px 16px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Change Name
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div style={{
                    height: '400px',
                    overflowY: 'auto',
                    border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                    padding: '10px',
                    marginBottom: '20px',
                    marginTop: '20px',
                    backgroundColor: isDarkMode ? '#242424' : '#ffffff'
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
                                background: msg.userType === 'self'
                                    ? (isDarkMode ? '#1a4d7c' : '#e3f2fd')
                                    : msg.userType === MessageUserType.User
                                        ? (isDarkMode ? '#333' : '#f5f5f5')
                                        : (isDarkMode ? '#1b4d1b' : '#c3f1ba'),
                                padding: '8px',
                                borderRadius: '5px',
                                maxWidth: '80%',
                                color: isDarkMode ? '#fff' : '#000'
                            }}>
                                <div style={{ fontSize: '0.8em', marginBottom: '4px', opacity: 0.8 }}>{msg.from}</div>
                                <div>{msg.message}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={!connected || !name}
                        style={{
                            width: '80%',
                            marginRight: '10px',
                            backgroundColor: isDarkMode ? '#333' : '#fff',
                            color: isDarkMode ? '#fff' : '#000',
                            border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                            padding: '8px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!connected || !name}
                        style={{
                            backgroundColor: isDarkMode ? '#444' : '#e0e0e0',
                            color: isDarkMode ? '#fff' : '#000',
                            border: 'none',
                            padding: '8px 16px',
                            cursor: (!connected || !name) ? 'not-allowed' : 'pointer',
                            opacity: (!connected || !name) ? 0.5 : 1
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
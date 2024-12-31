//  User OnConnected response
export enum MessageType { ACK = 'ACK', REQUEST = 'REQ', RESPONSE = 'RESP' }

export interface ChatUserAck {
    type: MessageType.ACK;
    userId: string;
    generatedName: string;
}

//  Recieved by server
export interface ChatMessageRequest {
    type: MessageType.REQUEST;
    userId: string;
    message: string;
}

//  Recieved by clients (no ID)
export interface ChatMessage {
    type: MessageType.RESPONSE;
    userName: string;
    message: string;
}

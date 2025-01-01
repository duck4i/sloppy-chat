//  User OnConnected response
export enum MessageType { 
    ACK = 'ACK', 
    SESSION_CREATE = 'SRC', 
    SESSION_RESP = 'SRP', 
    MSG_REQUEST = 'REQ', 
    MSG_RESPONSE = 'RESP', 
    NAME_CHANGE = 'NAME',
    NAME_CHANGE_ACK = 'NACK'
}

// 
//  For security purposes make sure no user ID is ever passed to the client or broadcasted.
//  Some of the messages may look duplicate for this exact reason.
//

//  User is connected and server passes this to client
export interface ChatUserConnectedAck {
    type: MessageType.ACK;
    userId: string;
}

//  User is connected to server and creates session
export interface ChatUserCreateSession {
    type: MessageType.SESSION_CREATE;
    userId: string;
    desiredName: string;
}

//  User session created acknowledges to client
export interface ChatUserCreateSessionAck {
    type: MessageType.SESSION_RESP;
}

//  New chat message from client
export interface ChatMessageRequest {
    type: MessageType.MSG_REQUEST;
    userId: string;
    message: string;
}

//  Broadcast message recieved by clients (no ID)
export interface ChatMessage {
    type: MessageType.MSG_RESPONSE;
    userName: string;
    message: string;
}

//  User requested name change
export interface ChatUserNameChange {
    type: MessageType.NAME_CHANGE,
    userId: string;
    newName: string;
}

//  User name change acknowledged
export interface ChatUserNameChangeAck {
    type: MessageType.NAME_CHANGE_ACK;
    success: boolean;
    newName: string;
}
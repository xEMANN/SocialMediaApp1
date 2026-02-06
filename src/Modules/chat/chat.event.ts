
import { Server } from "socket.io";
import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatService } from "./chat.service";

export class ChatEvent {
    private _chatService = new ChatService();
    constructor() {}

    sayHi = (socket: IAuthSocket , io:Server) => {
        return socket.on("sayHi", (message, callback) => {
            this._chatService.sayHi({ message, socket, callback,io });
        });
    };

    sendMessage = (socket: IAuthSocket, io:Server) => {
        return socket.on(
            "sendMessage",
            (data: { content: string; sendTo: string}) => {
                this._chatService.sendMessage({ ... data, socket, io});
            }
        );
    };

    joinRoom = (socket: IAuthSocket, io: Server) => {
    socket.on("join_room", (data: { roomId: string }) => {
        ChatService.joinRoom({ ...data, socket, io });
      });
    };

    sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    socket.on("sendGroupMessage", (data: { content: string; groupId: string }) => {
        ChatService.sendGroupMessage({ 
            content: data.content, 
            groupId: data.groupId, 
            socket, 
            io 
        });
    });
};
} 
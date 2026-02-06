import { Server } from "socket.io";
import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatEvent } from "./chat.event";

export class ChatGateway {
    private _chatEvent = new ChatEvent();

    register = (socket: IAuthSocket, io: Server) => {
        this._chatEvent.sayHi(socket, io);
        this._chatEvent.sendMessage(socket, io);
        this._chatEvent.joinRoom(socket, io);
        this._chatEvent.sendGroupMessage(socket, io);
    };
}
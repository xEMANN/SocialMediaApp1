"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvent = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvent {
    _chatService = new chat_service_1.ChatService();
    constructor() { }
    sayHi = (socket, io) => {
        return socket.on("sayHi", (message, callback) => {
            this._chatService.sayHi({ message, socket, callback, io });
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", (data) => {
            this._chatService.sendMessage({ ...data, socket, io });
        });
    };
    joinRoom = (socket, io) => {
        socket.on("join_room", (data) => {
            chat_service_1.ChatService.joinRoom({ ...data, socket, io });
        });
    };
    sendGroupMessage = (socket, io) => {
        socket.on("sendGroupMessage", (data) => {
            chat_service_1.ChatService.sendGroupMessage({
                content: data.content,
                groupId: data.groupId,
                socket,
                io
            });
        });
    };
}
exports.ChatEvent = ChatEvent;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_event_1 = require("./chat.event");
class ChatGateway {
    _chatEvent = new chat_event_1.ChatEvent();
    register = (socket, io) => {
        this._chatEvent.sayHi(socket, io);
        this._chatEvent.sendMessage(socket, io);
        this._chatEvent.joinRoom(socket, io);
        this._chatEvent.sendGroupMessage(socket, io);
    };
}
exports.ChatGateway = ChatGateway;

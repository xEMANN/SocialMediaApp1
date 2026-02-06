"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_event_1 = require("./chat.event");
class ChatGateway {
    _chatEvent = new chat_event_1.ChatEvent();
    constructor() { }
    register = (socket) => {
        this._chatEvent.sayHi(socket);
    };
}
exports.ChatGateway = ChatGateway;

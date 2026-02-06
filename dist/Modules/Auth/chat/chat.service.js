"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
class ChatService {
    constructor() { }
    sayHi = ({ message, socket, callback }) => {
        try {
            console.log(message);
            callback ? callback("I Recived Your Message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;

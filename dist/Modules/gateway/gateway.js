"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.intialize = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const token_1 = require("../../Utils/security/token");
const chat_gateway_1 = require("../chat/chat.gateway");
exports.connectedSockets = new Map();
function disconnection(socket) {
    socket.on("disconnect", () => {
        const userId = socket.credentials?.user?._id?.toString();
        if (!userId)
            return;
        let remainingTabs = exports.connectedSockets.get(userId)?.filter((tab) => tab !== socket.id) || [];
        if (remainingTabs.length) {
            exports.connectedSockets.set(userId, remainingTabs);
        }
        else {
            exports.connectedSockets.delete(userId);
        }
        console.log(`User Disconnected: ${userId} - Socket: ${socket.id}`);
        console.log(exports.connectedSockets);
    });
}
let io = null;
const intialize = (server) => {
    io = new socket_io_1.Server(server, { cors: { origin: "*" } });
    io.use(async (socket, next) => {
        try {
            const { user, decoded } = await (0, token_1.decodedToken)({
                authorization: socket.handshake.auth.authorization,
                tokenType: token_1.TokenTypeEnum.ACCESS,
            });
            socket.credentials = { user, decoded };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        const userId = socket.credentials?.user?._id?.toString();
        if (userId) {
            const userTabs = exports.connectedSockets.get(userId) || [];
            if (!userTabs.includes(socket.id)) {
                userTabs.push(socket.id);
            }
            exports.connectedSockets.set(userId, userTabs);
        }
        console.log("Current Connected Sockets:", exports.connectedSockets);
        chatGateway.register(socket, io);
        disconnection(socket);
    });
};
exports.intialize = intialize;
const getIo = () => {
    if (!io)
        throw new Error("Socket.id not intialized");
    return io;
};
exports.getIo = getIo;

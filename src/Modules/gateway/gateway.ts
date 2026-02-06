import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { decodedToken, TokenTypeEnum } from "../../Utils/security/token";
import { IAuthSocket } from "./gateway.dto";
import { ChatGateway } from "../chat/chat.gateway";

export const connectedSockets = new Map<string, string[]>();

function disconnection(socket: IAuthSocket) {
    socket.on("disconnect", () => {
        const userId = socket.credentials?.user?._id?.toString();
        if (!userId) return;

        let remainingTabs = connectedSockets.get(userId)?.filter((tab) => tab !== socket.id) || [];
        
        if (remainingTabs.length) {
            connectedSockets.set(userId, remainingTabs);
        } else {
            connectedSockets.delete(userId);
        }
        
        console.log(`User Disconnected: ${userId} - Socket: ${socket.id}`);
        console.log(connectedSockets);
    });
}

let io: Server | null = null;

export const intialize = (server: HttpServer) => {
    io = new Server(server, { cors: { origin: "*" } });

    io.use(async (socket: IAuthSocket, next) => {
        try {
            const { user, decoded } = await decodedToken({
                authorization: socket.handshake.auth.authorization as string,
                tokenType: TokenTypeEnum.ACCESS,
            });
            socket.credentials = { user, decoded };
            next();
        } catch (error: any) {
            next(error);
        }
    });

    const chatGateway: ChatGateway = new ChatGateway();
    io.on("connection", (socket: IAuthSocket) => {
        const userId = socket.credentials?.user?._id?.toString();
        
        if (userId) {
            const userTabs = connectedSockets.get(userId) || [];
            if (!userTabs.includes(socket.id)) {
                userTabs.push(socket.id);
            }
            connectedSockets.set(userId, userTabs);
        }

        console.log("Current Connected Sockets:", connectedSockets);
        
        chatGateway.register(socket, io!);
        disconnection(socket);
    });
};

export const getIo = (): Server => {
    if(!io) throw new Error("Socket.id not intialized");
    return io;
};
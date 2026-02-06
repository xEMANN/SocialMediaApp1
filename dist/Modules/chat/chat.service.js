"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const chat_repository_1 = require("../../DB/repository/chat.repository");
const user_repository_1 = require("../../DB/repository/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const chat_model_1 = require("../../DB/models/chat.model");
const mongoose_1 = require("mongoose");
const error_response_1 = require("../../Utils/response/error.response");
const gateway_1 = require("../gateway/gateway");
const uuid_1 = require("uuid");
class ChatService {
    static _chatModel = new chat_repository_1.ChatRepository(chat_model_1.ChatModel);
    static _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    static getChat = async (req, res) => {
        const { userId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        new mongoose_1.Types.ObjectId(userId),
                    ],
                },
                group: { $exists: false },
            },
            options: { populate: "participants" },
        });
        return res.status(200).json({
            message: "Done",
            data: { chat: chat || 0 }
        });
    };
    static getGroupChat = async (req, res) => {
        const { groupId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: [req.user?._id] },
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy",
                        select: "username profilePicture",
                    },
                    {
                        path: "participants",
                        select: "username profilePicture",
                    },
                ],
            },
        });
        if (!chat)
            throw new error_response_1.BadRequestException("Fail to Find Chat");
        return res.status(200).json({
            message: "Done",
            data: { chat }
        });
    };
    static createGroupChat = async (req, res) => {
        const { participants, group } = req.body;
        const dbParticipants = participants.map((participant) => {
            return mongoose_1.Types.ObjectId.createFromHexString(participant);
        });
        const users = await ChatService._userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: [req.user?._id] },
            },
        });
        if (dbParticipants.length !== users.length) {
            throw new error_response_1.BadRequestException("Please Provide valid dbParticipants");
        }
        const roomId = (0, uuid_1.v4)();
        const [newGroup] = (await ChatService._chatModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    group,
                    roomId,
                    participants: [...dbParticipants, req.user?._id],
                },
            ],
        })) || [];
        if (!newGroup)
            throw new error_response_1.BadRequestException("Fail to create Group chat");
        return res.status(200).json({ message: "Done", data: { newGroup } });
    };
    sayHi = ({ message, socket, callback }) => {
        try {
            console.log(message);
            callback ? callback("I Recived Your Message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, socket, sendTo, io }) => {
        try {
            const createdBy = socket.credentials?.user?._id;
            const user = await ChatService._userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] },
                },
            });
            if (!user)
                throw new error_response_1.NotFoundException("User Not Found");
            const chat = await ChatService._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy,
                            mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                        ],
                    },
                    group: { $exists: false },
                },
                update: {
                    $addToSet: {
                        messages: { content, createdBy },
                    },
                },
            });
            if (!chat) {
                const [newChat] = (await ChatService._chatModel.create({
                    data: [
                        {
                            createdBy,
                            messages: [{ content, createdBy }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                            ],
                        },
                    ],
                })) || [];
                if (!newChat)
                    throw new error_response_1.BadRequestException("Fail To Create Chat");
            }
            socket.emit("successMessage", { content });
            const receiverSockets = gateway_1.connectedSockets.get(sendTo);
            if (receiverSockets) {
                receiverSockets.forEach((socketId) => {
                    io.to(socketId).emit("newMessage", {
                        content,
                        from: socket.credentials?.user
                    });
                });
            }
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    static joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this._chatModel.findOne({
                filter: {
                    roomId,
                    participants: {
                        $in: [socket.credentials?.user?._id],
                    },
                    group: { $exists: true },
                },
            });
            if (!chat)
                throw new error_response_1.NotFoundException("Fail To join Room");
            socket.join(chat.roomId);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    static sendGroupMessage = async ({ content, groupId, socket, io, }) => {
        try {
            const createdBy = socket.credentials?.user?._id;
            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: { $in: [createdBy] },
                    group: { $exists: true },
                },
                update: {
                    $addToSet: {
                        messages: {
                            content,
                            createdBy,
                            sentAt: new Date()
                        },
                    },
                },
            });
            if (!chat)
                throw new error_response_1.NotFoundException("Fail To Matchig Group");
            socket.emit("successMessage", { content });
            io.to(chat.roomId).emit("newMessage", {
                content,
                from: socket.credentials?.user,
                groupId,
                sentAt: new Date()
            });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;

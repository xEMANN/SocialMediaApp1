import { Request, Response } from "express";
import { ICreateGroupChatDTO, IGetChatDTO, IGetGroupChatDTO, IJoinRoomDTO, ISayHiDTO, ISendGroupMessageDTO, ISendMessageDTO } from "./chat.dto";
import { ChatRepository } from "../../DB/repository/chat.repository";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/models/user.model";
import { ChatModel } from "../../DB/models/chat.model";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../Utils/response/error.response";
import { connectedSockets } from "../gateway/gateway";
import { v4 as uuid }  from "uuid";
export class ChatService {
    private static _chatModel = new ChatRepository(ChatModel);
    private static _userModel = new UserRepository(UserModel);

    constructor() {}

    static getChat = async (req: Request, res: Response) => {
        const { userId } = req.params as unknown as IGetChatDTO;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [
                        (req as any).user?._id as Types.ObjectId,
                        new Types.ObjectId(userId),
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

    static getGroupChat = async (req: Request, res: Response) => {
    const { groupId } = req.params as unknown as IGetGroupChatDTO;

    const chat = await this._chatModel.findOne({
        filter: {
            _id: Types.ObjectId.createFromHexString(groupId),
            group: { $exists: true },
            participants: { $in: [(req as any).user?._id as Types.ObjectId] },
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

    if (!chat) throw new BadRequestException("Fail to Find Chat");

    return res.status(200).json({ 
        message: "Done", 
        data: { chat } 
    });
    };

    static createGroupChat = async (req: Request, res: Response) => {
    const { participants, group } = req.body as ICreateGroupChatDTO;
    const dbParticipants = participants.map((participant) => {
        return Types.ObjectId.createFromHexString(participant);
    });
    const users = await ChatService._userModel.find({
        filter: {
            _id: { $in: dbParticipants },
            friends: { $in: [(req as any).user?._id as Types.ObjectId] },
        },
    });

    if (dbParticipants.length !== users.length) {
        throw new BadRequestException("Please Provide valid dbParticipants");
    }
    const roomId = uuid();
    const [newGroup] = 
        (await ChatService._chatModel.create({
            data: [
                {
                    createdBy: (req as any).user?._id as Types.ObjectId,
                    group,
                    roomId,
                    participants: [...dbParticipants, (req as any).user?._id as Types.ObjectId],
                },
            ],
        })) || [];
    if (!newGroup) throw new BadRequestException("Fail to create Group chat");
    return res.status(200).json({ message: "Done", data: { newGroup } });
    };

    sayHi = ({ message, socket, callback }: ISayHiDTO) => {
        try {
            console.log(message);
            callback ? callback("I Recived Your Message") : undefined;
        } catch (error) {
            socket.emit("custom_error", error);
        }
    };

    sendMessage = async ({ content, socket, sendTo, io }: ISendMessageDTO) => {
        try {
            const createdBy = socket.credentials?.user?._id as Types.ObjectId;
            const user = await ChatService._userModel.findOne({
                filter: {
                    _id: Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] },
                },
            });

            if (!user) throw new NotFoundException("User Not Found");

            const chat = await ChatService._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy as Types.ObjectId,
                            Types.ObjectId.createFromHexString(sendTo),
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
                                Types.ObjectId.createFromHexString(sendTo),
                            ],
                        },
                    ],

                })) || [];
                if (!newChat) throw new BadRequestException("Fail To Create Chat");
            }

            socket.emit("successMessage", { content });

            const receiverSockets = connectedSockets.get(sendTo);
            if (receiverSockets) {
                receiverSockets.forEach((socketId) => {
                    io.to(socketId).emit("newMessage", { 
                        content, 
                        from: socket.credentials?.user 
                    });
                });
            }

        } catch (error) {
            socket.emit("custom_error", error);
        } 

    };

    static joinRoom = async ({ roomId, socket, io}: IJoinRoomDTO) => {
    try {
        const chat = await this._chatModel.findOne({
            filter: {
                roomId,
                participants: {
                    $in: [socket.credentials?.user?._id as Types.ObjectId],
                },
                group: { $exists: true },
            },
        });

        if (!chat) throw new NotFoundException("Fail To join Room");

        socket.join(chat.roomId as string);
      } catch (error) {
        socket.emit("custom_error", error);
      }
    };
    
    static sendGroupMessage = async ({
    content,
    groupId,
    socket,
    io,
 }: ISendGroupMessageDTO) => {
    try {
        const createdBy = socket.credentials?.user?._id as Types.ObjectId;
        
        const chat = await this._chatModel.findOneAndUpdate({
            filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
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

        if (!chat) throw new NotFoundException("Fail To Matchig Group");

        socket.emit("successMessage", { content });

        io.to(chat.roomId as string).emit("newMessage", {
            content,
            from: socket.credentials?.user,
            groupId,
            sentAt: new Date()
        });

    } catch (error) {
        socket.emit("custom_error", error);
    }
 };
}
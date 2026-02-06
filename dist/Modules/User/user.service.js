"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../Utils/security/token");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../DB/models/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("../../Utils/multer/s3.config");
const friend_repository_1 = require("../../DB/repository/friend.repository");
const friendRequest_model_1 = require("../../DB/models/friendRequest.model");
const error_response_1 = require("../../Utils/response/error.response");
const chat_repository_1 = require("../../DB/repository/chat.repository");
const chat_model_1 = require("../../DB/models/chat.model");
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _friendModel = new friend_repository_1.FriendRepository(friendRequest_model_1.FriendModel);
    _chatModel = new chat_repository_1.ChatRepository(chat_model_1.ChatModel);
    constructor() { }
    getProfile = async (req, res) => {
        const user = await this._userModel.findByUserId(req.decoded?._id);
        if (user) {
            await user.populate("friends");
        }
        const groups = await this._chatModel.find({
            filter: {
                participants: { $in: [req.user?._id] },
                group: { $exists: true }
            }
        });
        return res.status(200).json({
            message: "Done",
            profileImage: user?.profileImage || null,
            data: {
                user: user,
                friends: user?.friends || [],
                groups: groups || []
            }
        });
    };
    updateProfile = async (req, res) => {
        const { username, gender } = req.body;
        const updatedUser = await this._userModel.findOneAndUpdate({
            filter: { _id: req.decoded?._id },
            update: { $set: { username, gender } },
            options: { new: true }
        });
        if (!updatedUser)
            throw new error_response_1.NotFoundException("User Not Found");
        return res.status(200).json({
            message: "Profile Updated Successfully",
            user: updatedUser
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_1.LogoutEnum.ONLY:
                await (0, token_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
            case token_1.LogoutEnum.ALL:
                update.changeCredientialsTime = new Date();
                break;
            default:
                break;
        }
        await this._userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return res.status(statusCode).json({
            message: "Done",
        });
    };
    profileImage = async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }
        const { mimetype, originalname } = req.file;
        const { url, key } = await (0, s3_config_1.createPresignedURL)({
            ContentType: mimetype,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        await this._userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update: { profileImage: key },
        });
        return res.status(200).json({
            message: "Done",
            url,
            key,
        });
    };
    coverImages = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
        });
        return res.status(200).json({ message: "Done", urls });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkFriendRequestExists = await this._friendModel.findOne({
            $or: [
                { createdBy: req.user?._id, sendTo: new mongoose_1.Types.ObjectId(userId) },
                { createdBy: new mongoose_1.Types.ObjectId(userId), sendTo: req.user?._id }
            ]
        });
        if (!req.user) {
            throw new error_response_1.BadRequestException("Authenticated user not found");
        }
        if (checkFriendRequestExists) {
            throw new error_response_1.ConflictException("Friend Request Already Exists");
        }
        const friend = await friendRequest_model_1.FriendModel.create({
            createdBy: new mongoose_1.Types.ObjectId(req.user._id),
            sendTo: new mongoose_1.Types.ObjectId(userId)
        });
        console.log(friend);
        return res.status(201).json({ message: "Done", data: friend });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const checkFriendRequestExists = await this._friendModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptAt: { $exists: false },
            },
            $set: { acceptedAt: new Date()
            }
        });
        if (!req.user) {
            throw new error_response_1.BadRequestException("Authenticated user not found");
        }
        if (!checkFriendRequestExists) {
            throw new error_response_1.ConflictException("Fail To Accept Friend Request");
        }
        await Promise.all([
            this._userModel.updateOne({
                filter: { _id: checkFriendRequestExists.createdBy },
                update: { $addToSet: { friends: checkFriendRequestExists.sendTo } },
            }),
            this._userModel.updateOne({
                filter: { _id: checkFriendRequestExists.sendTo },
                update: { $addToSet: { friends: checkFriendRequestExists.createdBy } },
            }),
        ]);
        return res.status(201).json({ message: "Done" });
    };
}
exports.default = new UserService();

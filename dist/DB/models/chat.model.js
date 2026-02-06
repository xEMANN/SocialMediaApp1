"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = exports.ChatModel = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
        maxLength: 500000,
        minLength: 2,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
}, { timestamps: true });
const chatSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    ],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    group: String,
    group_image: String,
    roomId: {
        type: String,
        required: function () {
            return !!this.roomId;
        },
    },
    messages: [messageSchema],
}, { timestamps: true });
exports.ChatModel = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
exports.MessageModel = mongoose_1.models.Message || (0, mongoose_1.model)("Message", messageSchema);

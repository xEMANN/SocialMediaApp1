"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendModel = exports.friendSchema = void 0;
const mongoose_1 = require("mongoose");
exports.friendSchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    sendTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    acceptedAt: Date,
}, { timestamps: true });
exports.FriendModel = mongoose_1.models.Friend || (0, mongoose_1.model)("Friend", exports.friendSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    commentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    freezedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
}, { timestamps: true });
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);

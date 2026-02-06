"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.LikeUnLikeEnum = exports.AvailabilityEnum = exports.AllowCommentEnum = void 0;
const mongoose_1 = require("mongoose");
var AllowCommentEnum;
(function (AllowCommentEnum) {
    AllowCommentEnum["ALLOW"] = "ALLOW";
    AllowCommentEnum["DENY"] = "DENY";
})(AllowCommentEnum || (exports.AllowCommentEnum = AllowCommentEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["PUBLIC"] = "PUBLIC";
    AvailabilityEnum["FRIENDS"] = "FRIENDS";
    AvailabilityEnum["ONLY_ME"] = "ONLY_ME";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var LikeUnLikeEnum;
(function (LikeUnLikeEnum) {
    LikeUnLikeEnum["LIKE"] = "LIKE";
    LikeUnLikeEnum["UNLIKE"] = "UNLIKE";
})(LikeUnLikeEnum || (exports.LikeUnLikeEnum = LikeUnLikeEnum = {}));
const postSchema = new mongoose_1.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function () {
            return !this.attachments?.length;
        },
    },
    assetPostFolderId: String,
    attachments: [String],
    allowComments: {
        type: String,
        enum: Object.values(AllowCommentEnum),
        default: AllowCommentEnum.ALLOW,
    },
    avilablity: {
        type: String,
        enum: Object.values(AvailabilityEnum),
        default: AvailabilityEnum.PUBLIC,
    },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    freezedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
}, { timestamps: true });
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);

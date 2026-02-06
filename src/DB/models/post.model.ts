import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum AllowCommentEnum {
    ALLOW = "ALLOW",
    DENY = "DENY"
}

export enum AvailabilityEnum {
    PUBLIC = "PUBLIC",
    FRIENDS = "FRIENDS",
    ONLY_ME = "ONLY_ME"
}

export enum LikeUnLikeEnum {
    LIKE = "LIKE",
    UNLIKE = "UNLIKE"
}

export interface IPost {
    content?: string;
    attachments?: string[];
    assetPostFolderId?: string;
    allowComments: AllowCommentEnum;
    avilablity: AvailabilityEnum;
    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];
    createdBy: Types.ObjectId;
    freezedBy?: Types.ObjectId;
    freezedAt?: Date;
    restoredBy?: Types.ObjectId;
    restoredAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function (this: IPost) {
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
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    freezedAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
},
    { timestamps: true }
);

export const PostModel = models.Post || model<IPost>("Post", postSchema);
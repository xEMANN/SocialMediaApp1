import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IComment {
    content?: string;
    attachments?: string[];

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];

    createdBy: Types.ObjectId;
    postId: Types.ObjectId;
    commentId?: Types.ObjectId;

    freezedBy?: Types.ObjectId;
    freezedAt?: Date;

    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt: Date;
    updatedAt?: Date;
}

export type HCommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function (this: IComment) {
            return !this.attachments?.length;
        },
    },

    attachments: [String],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],

    commentId: { type: Schema.Types.ObjectId, ref: "User" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    postId: { type: Schema.Types.ObjectId, ref: "Post" },

    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },

    freezedAt: Date,

    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
 },
    { timestamps: true }
);


export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);
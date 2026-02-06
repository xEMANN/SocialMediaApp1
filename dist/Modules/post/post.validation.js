"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePostSchema = exports.createPostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const post_model_1 = require("../../DB/models/post.model");
const cloud_multer_1 = require("../../Utils/multer/cloud.multer");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
exports.createPostSchema = {
    body: zod_1.default
        .strictObject({
        content: zod_1.default.string().min(2).max(500000).optional(),
        attachments: zod_1.default
            .array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image))
            .max(3)
            .optional(),
        allowComments: zod_1.default.enum(post_model_1.AllowCommentEnum).default(post_model_1.AllowCommentEnum.ALLOW),
        avilablity: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.PUBLIC),
        likes: zod_1.default.array(validation_middleware_1.generalFields.id).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(20).optional(),
    })
        .superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Please Provide content or attachments",
            });
        }
        if (data.tags?.length &&
            data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Please Provide Unique Tags",
            });
        }
    }),
};
exports.likePostSchema = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.enum(post_model_1.LikeUnLikeEnum).default(post_model_1.LikeUnLikeEnum.LIKE),
    }),
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comment_repository_1 = require("../../DB/repository/comment.repository");
const comment_model_1 = require("../../DB/models/comment.model");
const post_model_1 = require("../../DB/models/post.model");
const user_model_1 = require("../../DB/models/user.model");
const post_repository_1 = require("../../DB/repository/post.repository");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../Utils/response/error.response");
const post_service_1 = require("../post/post.service");
const s3_config_1 = require("../../Utils/multer/s3.config");
class CommentService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    _commentModel = new comment_repository_1.CommentRepository(comment_model_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                allowComments: post_model_1.AllowCommentEnum.ALLOW,
                $or: (0, post_service_1.postAvailability)(req),
            },
        });
        if (!post)
            throw new error_response_1.NotFoundException("Fail To Match Results");
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some Mentioned User does not exists");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
            });
        }
        const [comment] = (await this._commentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    createdBy: req.user?._id,
                }
            ]
        })) || [];
        if (!comment)
            throw new error_response_1.BadRequestException("Fail To Create Comment");
        return res.status(201).json({ message: "Comment Created Successfully" });
    };
    ;
}
exports.default = new CommentService();

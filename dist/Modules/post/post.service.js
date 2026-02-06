"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = void 0;
const post_model_1 = require("../../DB/models/post.model");
const user_model_1 = require("../../DB/models/user.model");
const post_repository_1 = require("../../DB/repository/post.repository");
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("../../Utils/multer/s3.config");
const error_response_1 = require("../../Utils/response/error.response");
const uuid_1 = require("uuid");
const postAvailability = (req) => {
    const userId = req.user?._id;
    const friends = req.user?.friends || [];
    return [
        { avilablity: post_model_1.AvailabilityEnum.PUBLIC },
        { createdBy: userId },
        {
            avilablity: post_model_1.AvailabilityEnum.FRIENDS,
            createdBy: { $in: friends }
        }
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some Mentioned User Does Not Exists");
        }
        let attachments = [];
        let assetFolder = undefined;
        if (req.files?.length) {
            let assetPostFolderId = (0, uuid_1.v4)();
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetPostFolderId}`,
            });
            assetFolder = assetPostFolderId;
        }
        const [post] = (await this._postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetFolder,
                    createdBy: req.user?._id,
                }
            ]
        })) || [];
        if (!post)
            throw new error_response_1.BadRequestException("Fail To Create Post");
        return res.status(201).json({ message: "Post Created Successfully", post });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === post_model_1.LikeUnLikeEnum.UNLIKE) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this._postModel.findOneAndUpdate({
            filter: { _id: postId, avilablity: post_model_1.AvailabilityEnum.PUBLIC },
            update,
        });
        if (!post)
            throw new error_response_1.NotFoundException("Post Not Found");
        return res.status(200).json({ message: "Done", post });
    };
    getAllPosts = async (req, res) => {
        let { page, size } = req.query;
        const { results, docsCount, pages, currentPage } = await this._postModel.paginate({
            filter: { avilablity: post_model_1.AvailabilityEnum.PUBLIC },
            page,
            size
        });
        return res.status(200).json({
            message: "Posts Fetched Successfully",
            results,
            docsCount,
            pages,
            currentPage
        });
    };
}
exports.default = new PostService();

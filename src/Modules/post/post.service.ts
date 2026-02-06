import { Request, Response } from "express";
import { AvailabilityEnum, IPost, LikeUnLikeEnum, PostModel } from "../../DB/models/post.model";
import { UserModel } from "../../DB/models/user.model";
import { PostRepository } from "../../DB/repository/post.repository";
import { UserRepository } from "../../DB/repository/user.repository";
import { uploadFiles } from "../../Utils/multer/s3.config";
import { BadRequestException, NotFoundException } from "../../Utils/response/error.response";
import { v4 as uuidv4 } from "uuid";
import { UpdateQuery } from "mongoose";

export const postAvailability = (req: Request) => {
    const userId = (req as any).user?._id;
    const friends = (req as any).user?.friends || [];

    return [
        { avilablity: AvailabilityEnum.PUBLIC },
        { createdBy: userId },
        { 
            avilablity: AvailabilityEnum.FRIENDS, 
            createdBy: { $in: friends } 
        }
    ];
};

class PostService {
    private _userModel = new UserRepository(UserModel);
    private _postModel = new PostRepository(PostModel);

    constructor() {}

    createPost = async (req: Request, res: Response) => {
        if (
            req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length
        ) {
            throw new NotFoundException("Some Mentioned User Does Not Exists");
        }

        let attachments: string[] = [];
        let assetFolder = undefined;
        if ((req.files as any)?.length) {
            let assetPostFolderId = uuidv4();
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${(req as any).user?._id}/post/${assetPostFolderId}`,
            });
            assetFolder = assetPostFolderId;
        }

        const [post] = (await this._postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetFolder,
                    createdBy: (req as any).user?._id,
                }
            ]
        })) || [];

        if (!post) throw new BadRequestException("Fail To Create Post");

        return res.status(201).json({ message: "Post Created Successfully", post });
    };

    likePost = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };
    const { action } = req.query as unknown as { action: string };

    let update: UpdateQuery<IPost> = {
        $addToSet: { likes: (req as any).user?._id },
    };

    if (action === LikeUnLikeEnum.UNLIKE) {
        update = { $pull: { likes: (req as any).user?._id } };
    }

    const post = await this._postModel.findOneAndUpdate({
        filter: { _id: postId, avilablity: AvailabilityEnum.PUBLIC },
        update,
    });

    if (!post) throw new NotFoundException("Post Not Found");

    return res.status(200).json({ message: "Done", post });
  };

    getAllPosts = async (req: Request, res: Response) => {
    let { page, size } = req.query as unknown as { page: number; size: number };

    const { results, docsCount, pages, currentPage } = await this._postModel.paginate({
        filter: { avilablity: AvailabilityEnum.PUBLIC },
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

export default new PostService();
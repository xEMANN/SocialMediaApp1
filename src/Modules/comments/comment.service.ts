import { Request, Response } from "express";
import { CommentRepository } from "../../DB/repository/comment.repository";
import { CommentModel } from "../../DB/models/comment.model";
import { AllowCommentEnum, PostModel } from "../../DB/models/post.model";
import { UserModel } from "../../DB/models/user.model";
import { PostRepository } from "../../DB/repository/post.repository";
import { UserRepository } from "../../DB/repository/user.repository";
import { BadRequestException, NotFoundException } from "../../Utils/response/error.response";
import { postAvailability } from "../post/post.service";
import { uploadFiles } from "../../Utils/multer/s3.config";
class CommentService {
    private _userModel = new UserRepository(UserModel);
    private _postModel = new PostRepository(PostModel);
    private _commentModel = new CommentRepository(CommentModel)
    constructor() {}

    createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };
    const post = await this._postModel.findOne({
        filter: {
            _id: postId,
            allowComments: AllowCommentEnum.ALLOW,
            $or: postAvailability(req),
        },
    });

    if (!post) throw new NotFoundException("Fail To Match Results");

    if (
        req.body.tags?.length &&
        (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
            .length !== req.body.tags.length
    ) {
        throw new NotFoundException("Some Mentioned User does not exists");
    }
    
    let attachments: string[] = [];
        if ((req.files as any)?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
            });
        }

     const [comment] = (await this._commentModel.create({
         data: [
            {
                ...req.body,
                attachments,
                postId,
                createdBy: (req as any).user?._id,
             }
          ]
        })) || [];
        
     if (!comment) throw new BadRequestException("Fail To Create Comment");

                
    return res.status(201).json({ message: "Comment Created Successfully" });
};;
}

export default new CommentService();
import { Router } from "express";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { RoleEnum } from "../../DB/models/user.model";
import { validation } from "../../Middlewares/validation.middleware";
import { createPostSchema, likePostSchema } from "./post.validation";
import postService from "./post.service";
import commentRouter from "../comments/comment.controller";

const router : Router = Router();

router.use("/:postId/comment", commentRouter);

router.post(
    "/",
    authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
    validation(createPostSchema, postService.createPost)
);

router.patch(
    "/:postId/like",
    authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
    validation(likePostSchema, postService.likePost)
);

router.get(
    "/",
    authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
    postService.getAllPosts
);

export default router;
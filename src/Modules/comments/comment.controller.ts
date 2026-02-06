import { Router } from "express";
import { authentication } from "../../Middlewares/authentication.middleware";
import { endpoint } from "./comment.authorization";
import commentService from "./comment.service";
import { TokenTypeEnum } from "../../Utils/security/token";
import { validation } from "../../Middlewares/validation.middleware";
import * as validators from "./comment.validation";
import { cloudFileUpload, fileValidation } from "../../Utils/multer/cloud.multer";

const router: Router = Router({
    mergeParams: true,
});

router.post(
    "/",
    authentication(TokenTypeEnum.ACCESS, endpoint.createComment),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 3),
    validation(validators.createCommentSchema, commentService.createComment)
);

export default router;
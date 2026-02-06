import { Router } from "express";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { RoleEnum } from "../../DB/models/user.model";
import userService from "./user.service";
import { validation } from "../../Middlewares/validation.middleware";
import { logoutSchema } from "./user.validation";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../Utils/multer/cloud.multer";
import { endpoint } from "./user.authorization";
import * as validators from "./user.validation";
import chatRouter from "../chat/chat.controller"

const router: Router = Router();

router.use("/:userId/chat", chatRouter);

router.get(
  "/profile",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  userService.getProfile
);

router.patch(
  "/update-profile",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  userService.updateProfile
);

router.post(
  "/logout",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  validation(logoutSchema, userService.logout)
);

const uploadMiddleware = cloudFileUpload({
  validation: [...fileValidation.image],
  storageApproch: StorageEnum.MEMORY,
  maxSizeMB: 6,
}).single("attachments");

router.patch(
  "/profile-image",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  uploadMiddleware,
  userService.profileImage 
);

router.patch(
  "/cover-images",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  cloudFileUpload({
      validation: fileValidation.image,
      storageApproch: StorageEnum.MEMORY,
      maxSizeMB: 6,
  }).array("attachments", 5),
  userService.coverImages
);

router.post(
  "/:userId/friend-request",
  authentication(TokenTypeEnum.ACCESS, endpoint.friendRequest),
  validation(validators.SendFriendRequestSchema, userService.sendFriendRequest)
);

router.patch(
  "/:requestId/accept",
  authentication(TokenTypeEnum.ACCESS, endpoint.acceptFriend),
  validation(validators.AcceptFriendRequestSchema, userService.acceptFriendRequest)
);

export default router;
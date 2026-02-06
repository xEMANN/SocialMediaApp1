"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const token_1 = require("../../Utils/security/token");
const user_model_1 = require("../../DB/models/user.model");
const user_service_1 = __importDefault(require("./user.service"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const user_validation_1 = require("./user.validation");
const cloud_multer_1 = require("../../Utils/multer/cloud.multer");
const user_authorization_1 = require("./user.authorization");
const validators = __importStar(require("./user.validation"));
const chat_controller_1 = __importDefault(require("../chat/chat.controller"));
const router = (0, express_1.Router)();
router.use("/:userId/chat", chat_controller_1.default);
router.get("/profile", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), user_service_1.default.getProfile);
router.patch("/update-profile", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), user_service_1.default.updateProfile);
router.post("/logout", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), (0, validation_middleware_1.validation)(user_validation_1.logoutSchema, user_service_1.default.logout));
const uploadMiddleware = (0, cloud_multer_1.cloudFileUpload)({
    validation: [...cloud_multer_1.fileValidation.image],
    storageApproch: cloud_multer_1.StorageEnum.MEMORY,
    maxSizeMB: 6,
}).single("attachments");
router.patch("/profile-image", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), uploadMiddleware, user_service_1.default.profileImage);
router.patch("/cover-images", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), (0, cloud_multer_1.cloudFileUpload)({
    validation: cloud_multer_1.fileValidation.image,
    storageApproch: cloud_multer_1.StorageEnum.MEMORY,
    maxSizeMB: 6,
}).array("attachments", 5), user_service_1.default.coverImages);
router.post("/:userId/friend-request", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, user_authorization_1.endpoint.friendRequest), (0, validation_middleware_1.validation)(validators.SendFriendRequestSchema, user_service_1.default.sendFriendRequest));
router.patch("/:requestId/accept", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, user_authorization_1.endpoint.acceptFriend), (0, validation_middleware_1.validation)(validators.AcceptFriendRequestSchema, user_service_1.default.acceptFriendRequest));
exports.default = router;

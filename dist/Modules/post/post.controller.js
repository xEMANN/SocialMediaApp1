"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const token_1 = require("../../Utils/security/token");
const user_model_1 = require("../../DB/models/user.model");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const post_validation_1 = require("./post.validation");
const post_service_1 = __importDefault(require("./post.service"));
const comment_controller_1 = __importDefault(require("../comments/comment.controller"));
const router = (0, express_1.Router)();
router.use("/:postId/comment", comment_controller_1.default);
router.post("/", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), (0, validation_middleware_1.validation)(post_validation_1.createPostSchema, post_service_1.default.createPost));
router.patch("/:postId/like", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), (0, validation_middleware_1.validation)(post_validation_1.likePostSchema, post_service_1.default.likePost));
router.get("/", (0, authentication_middleware_1.authentication)(token_1.TokenTypeEnum.ACCESS, [user_model_1.RoleEnum.USER]), post_service_1.default.getAllPosts);
exports.default = router;

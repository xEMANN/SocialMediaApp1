"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptFriendRequestSchema = exports.SendFriendRequestSchema = exports.logoutSchema = void 0;
const zod_1 = require("zod");
const token_1 = require("../../Utils/security/token");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
exports.logoutSchema = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_1.LogoutEnum).default(token_1.LogoutEnum.ONLY),
    }),
};
exports.SendFriendRequestSchema = {
    params: zod_1.z.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.AcceptFriendRequestSchema = {
    params: zod_1.z.strictObject({
        requestId: validation_middleware_1.generalFields.id,
    }),
};

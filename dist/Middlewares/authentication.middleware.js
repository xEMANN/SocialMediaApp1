"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const token_1 = require("../Utils/security/token");
const error_response_1 = require("../Utils/response/error.response");
const authentication = (tokenType = token_1.TokenTypeEnum.ACCESS, accessRoles = []) => {
    return async (req, _res, next) => {
        try {
            if (!req.headers.authorization) {
                return next(new error_response_1.BadRequestException("Missing Authorization Header"));
            }
            const { decoded, user } = await (0, token_1.decodedToken)({
                authorization: req.headers.authorization,
                tokenType,
            });
            if (accessRoles.length && !accessRoles.includes(user.role)) {
                return next(new error_response_1.ForbiddenException("You are not authorized to access this route"));
            }
            req.user = user;
            req.decoded = decoded;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authentication = authentication;

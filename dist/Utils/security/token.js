"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodedToken = exports.createLoginCredentials = exports.getSignature = exports.getSignatureLevel = exports.verifyToken = exports.generateToken = exports.LogoutEnum = exports.TokenTypeEnum = exports.SignatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = require("../../DB/models/user.model");
const uuid_1 = require("uuid");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const token_repository_1 = require("../../DB/repository/token.repository");
const token_model_1 = require("../../DB/models/token.model");
const error_response_2 = require("../response/error.response");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["USER"] = "USER";
    SignatureLevelEnum["ADMIN"] = "ADMIN";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum["ACCESS"] = "ACCESS";
    TokenTypeEnum["REFRESH"] = "REFRESH";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum["ONLY"] = "ONLY";
    LogoutEnum["ALL"] = "ALL";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
const generateToken = async ({ payload, secret, options, }) => {
    return await (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret, options, }) => {
    return await new Promise((resolve, reject) => {
        (0, jsonwebtoken_1.verify)(token, secret, options, (err, decoded) => {
            if (err)
                return reject(err);
            resolve(decoded);
        });
    });
};
exports.verifyToken = verifyToken;
const getSignatureLevel = async (role = user_model_1.RoleEnum.USER) => {
    let signatureLevel = SignatureLevelEnum.USER;
    switch (role) {
        case user_model_1.RoleEnum.ADMIN:
            signatureLevel = SignatureLevelEnum.ADMIN;
            break;
        case user_model_1.RoleEnum.USER:
            signatureLevel = SignatureLevelEnum.USER;
            break;
        default:
            break;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignature = async (signatureLevel = SignatureLevelEnum.USER) => {
    let signatures = {
        access_token: "",
        refresh_token: "",
    };
    switch (signatureLevel) {
        case SignatureLevelEnum.ADMIN:
            signatures.access_token = process.env.ACCESS_ADMIN_TOKEN_SECRET;
            signatures.refresh_token = process.env.REFRESH_ADMIN_TOKEN_SECRET;
            break;
        case SignatureLevelEnum.USER:
            signatures.access_token = process.env.ACCESS_USER_TOKEN_SECRET;
            signatures.refresh_token = process.env.REFRESH_USER_TOKEN_SECRET;
            break;
        default:
            break;
    }
    return signatures;
};
exports.getSignature = getSignature;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.getSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignature)(signatureLevel);
    const jwtid = (0, uuid_1.v4)();
    const access_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_token,
        options: {
            expiresIn: Number(process.env.ACCESS_EXPIRES_IN),
            jwtid,
        },
    });
    const refresh_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_token,
        options: {
            expiresIn: Number(process.env.REFRESH_EXPIRES_IN),
            jwtid,
        },
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodedToken = async ({ authorization, tokenType = TokenTypeEnum.ACCESS, }) => {
    const userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const token = authorization.includes(" ")
        ? authorization.split(" ")[1]
        : authorization;
    if (!token)
        throw new error_response_1.UnAuthorizedException("Missing Token");
    const signatures = await (0, exports.getSignature)(SignatureLevelEnum.USER);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenTypeEnum.REFRESH
            ? signatures.refresh_token
            : signatures.access_token
    });
    if (!decoded?._id || !decoded.iat)
        throw new error_response_1.UnAuthorizedException("Invalid Token Payload");
    if (await tokenModel.findByJti(decoded.jti))
        throw new error_response_1.UnAuthorizedException("Invalid Token payload");
    const user = await userModel.findByUserId(decoded._id.toString());
    if (!user)
        throw new error_response_1.NotFoundException("User Not Found");
    if ((user.changeCredientialsTime?.getTime() || 0) > decoded.iat * 1000)
        throw new error_response_1.UnAuthorizedException("Loggedout From All Devices");
    return { user, decoded };
};
exports.decodedToken = decodedToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [results] = (await tokenModel.create({
        data: [
            {
                jti: decoded.jti,
                expiresIn: decoded.iat,
                userId: decoded._id,
            },
        ],
    })) || [];
    if (!results)
        throw new error_response_2.BadRequestException("Fail to revoke token");
    return results;
};
exports.createRevokeToken = createRevokeToken;

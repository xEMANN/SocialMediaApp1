import { sign, Secret, SignOptions, JwtPayload, VerifyOptions, verify } from "jsonwebtoken";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/models/user.model";
import { v4 as uuid } from "uuid";
import { NotFoundException, UnAuthorizedException } from "../response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { TokenModel } from "../../DB/models/token.model";
import { BadRequestException } from "../response/error.response";

export enum SignatureLevelEnum {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum TokenTypeEnum {
    ACCESS = "ACCESS",
    REFRESH = "REFRESH",
}

export enum LogoutEnum {
    ONLY = "ONLY",
    ALL = "ALL",
}

export const generateToken = async ({
    payload,
    secret,
    options,
}: {
    payload: Record<string, unknown>;
    secret: Secret;
    options?: SignOptions;
}): Promise<string> => {
    return await sign(payload, secret, options);
};

export const verifyToken = async ({
    token,
    secret,
    options,
}: {
    token: string;
    secret: Secret;
    options?: VerifyOptions;
}): Promise<JwtPayload> => {
    return await new Promise((resolve, reject) => {
        verify(token, secret, options, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded as JwtPayload);
        });
    });
};

export const getSignatureLevel = async (role: RoleEnum = RoleEnum.USER) => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER;
    switch (role) {
        case RoleEnum.ADMIN:
            signatureLevel = SignatureLevelEnum.ADMIN;
            break;
        case RoleEnum.USER:
            signatureLevel = SignatureLevelEnum.USER;
            break;
        default:
            break;
    }
    return signatureLevel;
};

export const getSignature = async (
    signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER
): Promise<{ access_token: string; refresh_token: string }> => {
    let signatures: { access_token: string; refresh_token: string } = {
        access_token: "",
        refresh_token: "",
    };

    switch (signatureLevel) {
        case SignatureLevelEnum.ADMIN:
            signatures.access_token = process.env.ACCESS_ADMIN_TOKEN_SECRET as string;
            signatures.refresh_token = process.env.REFRESH_ADMIN_TOKEN_SECRET as string;
            break;
        case SignatureLevelEnum.USER:
            signatures.access_token = process.env.ACCESS_USER_TOKEN_SECRET as string;
            signatures.refresh_token = process.env.REFRESH_USER_TOKEN_SECRET as string;
            break;
        default:
            break;
    }
    return signatures;
};

export const createLoginCredentials = async (user: HUserDocument
): Promise<{ access_token: string; refresh_token: string }> => {
    const signatureLevel = await getSignatureLevel(user.role);
    const signatures = await getSignature(signatureLevel);
    const jwtid = uuid();

    const access_token = await generateToken({
        payload: { _id: user._id },
        secret: signatures.access_token,
        options: {
            expiresIn: Number(process.env.ACCESS_EXPIRES_IN),
            jwtid,
        },
    });

    const refresh_token = await generateToken({
        payload: { _id: user._id },
        secret: signatures.refresh_token,
        options: {
            expiresIn: Number(process.env.REFRESH_EXPIRES_IN),
            jwtid,
        },
    });

    return { access_token, refresh_token };
};

export const decodedToken = async ({
    authorization,
    tokenType = TokenTypeEnum.ACCESS,
}: {
    authorization: string;
    tokenType?: TokenTypeEnum;
}) => {
    const userModel = new UserRepository(UserModel);
    const tokenModel = new TokenRepository(TokenModel);

    const token = authorization.includes(" ") 
        ? authorization.split(" ")[1] 
        : authorization;

    if (!token) throw new UnAuthorizedException("Missing Token");

    const signatures = await getSignature(SignatureLevelEnum.USER);

    const decoded = await verifyToken({
        token,
        secret: tokenType === TokenTypeEnum.REFRESH
            ? signatures.refresh_token
            : signatures.access_token
    });

    if (!decoded?._id || !decoded.iat)
        throw new UnAuthorizedException("Invalid Token Payload");

    if (await tokenModel.findByJti(decoded.jti as string))
        throw new UnAuthorizedException("Invalid Token payload");

    const user = await userModel.findByUserId(decoded._id.toString());
    if (!user) throw new NotFoundException("User Not Found");

    if ((user.changeCredientialsTime?.getTime() || 0) > decoded.iat * 1000)
        throw new UnAuthorizedException("Loggedout From All Devices");

    return { user, decoded };
};

export const createRevokeToken = async (decoded: JwtPayload) => {
    const tokenModel = new TokenRepository(TokenModel);

    const [results] =
        (await tokenModel.create({
            data: [
                {
                    jti: decoded.jti as string,
                    expiresIn: decoded.iat as number,
                    userId: decoded._id,
                },
            ],
        })) || [];

    if (!results) throw new BadRequestException("Fail to revoke token");

    return results;
};
import { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../DB/models/user.model";
import { decodedToken, TokenTypeEnum } from "../Utils/security/token";
import { BadRequestException, ForbiddenException } from "../Utils/response/error.response";

export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
  accessRoles: RoleEnum[] = []
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.headers.authorization) {
        return next(new BadRequestException("Missing Authorization Header"));
      }

      const { decoded, user } = await decodedToken({
        authorization: req.headers.authorization,
        tokenType,
      });

      if (accessRoles.length && !accessRoles.includes(user.role)) {
        return next(
          new ForbiddenException("You are not authorized to access this route")
        );
      }

      req.user = user;
      req.decoded = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
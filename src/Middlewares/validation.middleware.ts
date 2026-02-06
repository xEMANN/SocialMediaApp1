import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../Utils/response/error.response";
import { ZodError, ZodType } from "zod";
import * as z from "zod";
import { Types } from "mongoose";

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;

export const validation = (schema: SchemaType, controller: (req: Request, res: Response, next: NextFunction) => any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!schema || typeof schema !== 'object') {
        return controller(req, res, next);
      }

      const validationErrors: Array<{
        key: KeyReqType;
        issues: Array<{ message: string; path: (string | number | symbol)[] }>;
      }> = [];

      const schemaKeys = Object.keys(schema) as KeyReqType[];

      for (const key of schemaKeys) {
        if (!schema[key]) continue;

        const validationResults = schema[key]!.safeParse(req[key]);

        if (!validationResults.success) {
          const errors = validationResults.error as ZodError;
          validationErrors.push({
            key,
            issues: errors.issues.map((issue) => {
              return { message: issue.message, path: issue.path };
            }),
          });
        }
      }

      if (validationErrors.length > 0) {
        return next(new BadRequestException("Validation Error", {
          cause: validationErrors,
        }));
      }

      return controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export const generalFields = {
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(30, { message: "Username must be at most 30 characters long" }),
  email: z.string().email({ message: "Invalid Email Address" }),
  password: z.string(),
  confirmPassword: z.string(),
  otp: z.string().regex(/^\d{6}$/),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype as [string, ...string[]]),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .refine(
        (data) => {
          return data.path || data.buffer;
        },
        { message: "Please provide a file" }
      );
  },
  id: z.string().refine(
    (data) => {
      return Types.ObjectId.isValid(data);
    },
    { message: "Invalid tag id" }
  ),
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const error_response_1 = require("../Utils/response/error.response");
const z = __importStar(require("zod"));
const mongoose_1 = require("mongoose");
const validation = (schema, controller) => {
    return async (req, res, next) => {
        try {
            if (!schema || typeof schema !== 'object') {
                return controller(req, res, next);
            }
            const validationErrors = [];
            const schemaKeys = Object.keys(schema);
            for (const key of schemaKeys) {
                if (!schema[key])
                    continue;
                const validationResults = schema[key].safeParse(req[key]);
                if (!validationResults.success) {
                    const errors = validationResults.error;
                    validationErrors.push({
                        key,
                        issues: errors.issues.map((issue) => {
                            return { message: issue.message, path: issue.path };
                        }),
                    });
                }
            }
            if (validationErrors.length > 0) {
                return next(new error_response_1.BadRequestException("Validation Error", {
                    cause: validationErrors,
                }));
            }
            return controller(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validation = validation;
exports.generalFields = {
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(30, { message: "Username must be at most 30 characters long" }),
    email: z.string().email({ message: "Invalid Email Address" }),
    password: z.string(),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/),
    file: function (mimetype) {
        return z
            .strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimetype),
            buffer: z.any().optional(),
            path: z.string().optional(),
            size: z.number(),
        })
            .refine((data) => {
            return data.path || data.buffer;
        }, { message: "Please provide a file" });
    },
    id: z.string().refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data);
    }, { message: "Invalid tag id" }),
};

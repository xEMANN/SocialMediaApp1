"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.StorageEnum = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = __importDefault(require("node:os"));
const uuid_1 = require("uuid");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["MEMORY"] = "MEMORY";
    StorageEnum["DISK"] = "DISK";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
exports.fileValidation = {
    image: ["image/png", "image/jpeg", "image/jpg"],
    pdf: ["application/pdf"],
    doc: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
};
const cloudFileUpload = ({ validation = [], storageApproch = StorageEnum.MEMORY, maxSizeMB = 2, }) => {
    const storage = storageApproch === StorageEnum.MEMORY
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: node_os_1.default.tmpdir(),
            filename: (_req, file, cb) => {
                cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
            },
        });
    const fileFilter = (_req, file, cb) => {
        if (validation.length && !validation.includes(file.mimetype)) {
            return cb(new Error("Invalid file type"));
        }
        cb(null, true);
    };
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: maxSizeMB * 1024 * 1024 },
    });
};
exports.cloudFileUpload = cloudFileUpload;

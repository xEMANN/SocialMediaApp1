import multer from "multer";
import os from "node:os";
import { v4 as uuid } from "uuid";
import { Request } from "express";

export enum StorageEnum {
  MEMORY = "MEMORY",
  DISK = "DISK",
}

export const fileValidation = {
  image: ["image/png", "image/jpeg", "image/jpg"],
  pdf: ["application/pdf"],
  doc: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const cloudFileUpload = ({
  validation = [],
  storageApproch = StorageEnum.MEMORY,
  maxSizeMB = 2,
}: {
  validation?: string[];
  storageApproch?: StorageEnum;
  maxSizeMB?: number;
}) => {
  const storage =
    storageApproch === StorageEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: (_req: Request, file: Express.Multer.File, cb) => {
            cb(null, `${uuid()}-${file.originalname}`);
          },
        });

  const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (validation.length && !validation.includes(file.mimetype)) {
      return cb(new Error("Invalid file type")); 
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {v4 as uuid } from "uuid";
import { PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { StorageEnum } from "./cloud.multer";
import { BadRequestException } from "../response/error.response";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";



export const s3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
    });
};



export const uploadFile = async ({
    storageApproach = StorageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file,
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
}) => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${
            file.originalname
        }`,
        Body: storageApproach === StorageEnum.MEMORY ? file.buffer : file.path,
        ContentType: file.mimetype,
    });

    await s3Config().send(command);

    console.log(command.input.Key);

    if (!command?.input?.Key) 
        throw new BadRequestException("File upload failed");

    return command.input.Key;

    
};

export const uploadLargeFile = async ({
    storageApproach = StorageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file,
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
}) => {
    const upload = new Upload ({
        client : s3Config(),
        params : {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${
                file.originalname
            }`, 
            Body: storageApproach === StorageEnum.MEMORY ? file.buffer : file.path,
            ContentType: file.mimetype,
        },  
        partSize: 500 * 1024 * 1024, 
    });

    upload.on("httpUploadProgress" , (progress: any) => {
      console.log("upload progress" , progress);
    });

    const result = await upload.done();
    const uploadkey = result.Key;

    if (!uploadkey) 
        throw new BadRequestException("File to upload failed");
    return uploadkey;
};

export const uploadFiles = async ({
    storageApproach = StorageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    files,
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
}) => {
   let urls: string[] = [];
   urls = await Promise.all(
    files.map( async (file) => {
        return uploadFile({
            storageApproach,
            Bucket,
            ACL,
            path,
            file,
        });
    })
    );

 //  for (const file of files) {
       //const key = await uploadFile({
         //  storageApproach,
          // Bucket,
          // ACL,
         //  path,
         //  file,
    //   });

    //   urls.push(key);
  // }
    return urls;
};

export const createPresignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path = "general",
  ContentType,
  originalname,
  expiresIn = 120,
}: {
  Bucket?: string;
  path?: string;
  ContentType: string;
  originalname: string;
  expiresIn?: number;
}) => {
  const command = new PutObjectCommand({
    Bucket,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-presigned-${originalname}`,
    ContentType,
 });
    const url = await getSignedUrl(s3Config(), command, {
    expiresIn,
  });

  if (!url || !command?.input.Key){
    throw new BadRequestException("Fail to generate presigned URL");
    }

    return { url, key: command.input.Key };
};
 
export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  return await s3Config().send(command);
};

export const creatGetePresignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
  expiresIn = 120,

}: {
  Bucket?: string;
  Key: string;
  expiresIn?: number;
  downloadName?: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
 });
    const url = await getSignedUrl(s3Config(), command, {
    expiresIn,
  });

  if (!url){
    throw new BadRequestException("Fail to generate presigned URL");
    }

    return { url };
};

export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<DeleteObjectCommandOutput> => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });
  return await s3Config().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}): Promise<DeleteObjectCommandOutput> => {
  const Objects = urls.map((url) => {
    return { Key: url };
  });

  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects,
      Quiet,
    },
  });

  return await s3Config().send(command);
};
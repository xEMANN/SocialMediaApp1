import express from "express";
import type { Express, Response, Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import path from "node:path";
import authRouter from "./Modules/Auth/auth.controller"
import { BadRequestException, globalErrorHandler } from "./Utils/response/error.response";
import connectDB from "./DB/connection";
import userRouter from "./Modules/User/user.controller"
import { creatGetePresignedURL, deleteFile, deleteFiles, getFile } from "./Utils/multer/s3.config";
import { promisify } from "node:util";
import { pipeline } from "nodemailer/lib/xoauth2";
config({path:path.resolve("./config/.env.dev")});
import postRouter from "./Modules/post/post.controller"
import { intialize } from "./Modules/gateway/gateway";
import chatRouter from "./Modules/chat/chat.controller"
const createS3WriteStreamPipe = promisify(pipeline)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100,
  message: {
    status: 429,
    message: "Too Many Requests,Please Tty again later",
  },
});

export const bootstrap = async () => {
  const app: Express = express();
  const port: number = Number(process.env.PORT) || 3000;

  app.use(cors() , express.json(), helmet());
  app.use(limiter);
  await connectDB();

  app.get("/uploads/pre-signed*path", async (_req, _res) => {
    const {path} = _req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const url = await creatGetePresignedURL({Key});
    return _res.status(200).json({message:"Done", url});
  });


  app.get("/uploads/*path", async (_req, _res) => {
  
  const {downloadName} = _req.query;
  const {path} = _req.params as unknown as { path: string[] };
  const Key = path.join("/");
  const s3Response = await getFile({Key});
  if (!s3Response.Body) {
      throw new BadRequestException("Fail to fetch asset");
    }

  if (downloadName){
      _res.setHeader("Content-Disposition",
      `attachment; filename="${downloadName}"`);  
  }

    _res.setHeader("Content-Type", s3Response.ContentType || "application/octet-stream");
    
     return await createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      _res
    );  
});

  app.get("/test-s3", async (req: Request, res: Response) => {
  const { Key } = req.query as { Key: string };
  const results = await deleteFile({ Key: Key as string });
  return res.status(200).json({ message: "Done", results });
});

  app.get("/test", async (_req: Request, res: Response) => {
  const results = await deleteFiles({
    urls: [
      "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/1e175cc8-0ee4-4f18-86e2-dce20159607d-pc wallpaper.jpg",
      "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/7ec8d423-2d4a-43a0-bd8c-21ece9fd8bac-download (5).jpg",
      "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/e2226259-104d-41ec-b044-9a0b4d290d70-𝓫𝓵𝓾𝓮.jpg"
    ],
  });

  return res.status(200).json({ message: "Done", results });
});

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome To Social Media App" });
  });

  app.use("/api/v1/auth" , authRouter);
  app.use("/api/v1/user" , userRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/user", userRouter);
  app.use("/api/v1/post" , postRouter);
  app.use('/chat', chatRouter);


  app.use("/",(_req: Request, res: Response) => {
    res.status(404).json({ message: "Not Found Handler" });
  });

  app.use(globalErrorHandler);
  
  const httpServer = app.listen(port, () => {
    console.log(`Server Is Runing on port ${port}`);
  });
  intialize(httpServer);
 }

export default bootstrap;
import { Request, Response } from "express";
import { LogoutDTO } from "./user.dto";
import { createRevokeToken, LogoutEnum } from "../../Utils/security/token";
import { JwtPayload } from "jsonwebtoken";
import {   Types, UpdateQuery } from "mongoose";
import { IUser } from "../../DB/models/user.model";
import { UserModel } from "../../DB/models/user.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { createPresignedURL, uploadFiles  } from "../../Utils/multer/s3.config";
import { FriendRepository } from "../../DB/repository/friend.repository";
import { FriendModel } from "../../DB/models/friendRequest.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../Utils/response/error.response";
import { ChatRepository } from "../../DB/repository/chat.repository";
import { ChatModel } from "../../DB/models/chat.model";

class UserService {
  private _userModel = new UserRepository(UserModel);
  private _friendModel = new FriendRepository(FriendModel)
  private _chatModel = new ChatRepository(ChatModel)
  constructor() {}

  getProfile = async (req: Request, res: Response): Promise<Response> => {
    const user = await this._userModel.findByUserId(req.decoded?._id);
    if (user) {
        await user.populate("friends");
    }
    const groups = await this._chatModel.find({
        filter: {
            participants: { $in: [(req as any).user?._id as Types.ObjectId] },
            group: { $exists: true }
        }
    });
    return res.status(200).json({
      message: "Done",
      profileImage: user?.profileImage || null,
      data: {
        user: user,
        friends: user?.friends || [],
        groups: groups || [] 
      }
    });
  }; 

  updateProfile = async (req: Request, res: Response): Promise<Response> => {
      const { username, gender } = req.body;
  
      const updatedUser = await this._userModel.findOneAndUpdate({
          filter: { _id: req.decoded?._id },
          update: { $set: { username, gender } },
          options: { new: true }
      });
  
      if (!updatedUser) throw new NotFoundException("User Not Found");
  
      return res.status(200).json({ 
          message: "Profile Updated Successfully", 
          user: updatedUser 
      });
  };
   
  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: LogoutDTO = req.body;
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogoutEnum.ONLY:
        await createRevokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;

      case LogoutEnum.ALL:
        update.changeCredientialsTime = new Date();
        break;

      default:
        break;
    }

    await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });

    return res.status(statusCode).json({
      message: "Done",
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {

  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const { mimetype, originalname } = req.file;

  const { url, key } = await createPresignedURL({
    ContentType: mimetype,
    originalname,
    path: `users/${req.decoded?._id}`,
  });

  await this._userModel.updateOne({
    filter: { _id: req.decoded?._id },
    update: { profileImage: key },
  });

  return res.status(200).json({
    message: "Done",
    url,
    key,
  });
  };

  coverImages = async (req: Request, res: Response): Promise<Response> => {
    const urls = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.decoded?._id}/cover`,
    });

    return res.status(200).json({ message: "Done", urls });
  };

  sendFriendRequest = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as unknown as { userId: string };
    const checkFriendRequestExists = await this._friendModel.findOne({
        $or: [
            { createdBy: req.user?._id, sendTo: new Types.ObjectId(userId) },
            { createdBy: new Types.ObjectId(userId), sendTo: req.user?._id }
        ]
    } as any);
    if (!req.user) {
        throw new BadRequestException("Authenticated user not found");
    }
    if (checkFriendRequestExists) {
        throw new ConflictException("Friend Request Already Exists");
    }
    const friend = await FriendModel.create({
    createdBy: new Types.ObjectId(req.user._id),
    sendTo: new Types.ObjectId(userId)
  });

    console.log(friend);
       return res.status(201).json({ message: "Done", data: friend });
  };

  acceptFriendRequest = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { requestId } = req.params as unknown as { requestId: string };
    const checkFriendRequestExists = await this._friendModel.findOneAndUpdate({
        filter : {
          _id: requestId,
          sendTo: req.user?._id,
          acceptAt: { $exists: false},
        },
        $set: { acceptedAt: new Date() 
        }
    } as any);

    if (!req.user) {
        throw new BadRequestException("Authenticated user not found");
    }
    
    if (!checkFriendRequestExists) {
        throw new ConflictException("Fail To Accept Friend Request");
    }

    await Promise.all([
      this._userModel.updateOne({
         filter: { _id: checkFriendRequestExists.createdBy },
         update: { $addToSet: { friends: checkFriendRequestExists.sendTo } },
      }),
      this._userModel.updateOne({
         filter: { _id: checkFriendRequestExists.sendTo },
         update: { $addToSet: { friends: checkFriendRequestExists.createdBy } },
      }),
    ]);
       return res.status(201).json({ message: "Done"});
  };
  
 }

export default new UserService();

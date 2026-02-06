import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";
import { IFriendRequest } from "../models/friendRequest.model";

export class FriendRepository extends DatabaseRepository<IFriendRequest> {
  constructor(protected override readonly model: Model<IFriendRequest>) {
    super(model);
  }

    async findByJti(jti: string) {
    return this.model.findOne({ jti }).exec();
  } 
  
}
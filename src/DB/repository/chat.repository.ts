import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";
import { IChat } from "../models/chat.model";

export class ChatRepository extends DatabaseRepository<IChat> {
  constructor(protected override readonly model: Model<IChat>) {
    super(model);
  }

    async findByJti(jti: string) {
    return this.model.findOne({ jti }).exec();
  } 
  
}
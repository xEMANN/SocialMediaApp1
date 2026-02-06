import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";
import { IComment } from "../models/comment.model";

export class CommentRepository extends DatabaseRepository<IComment> {
  constructor(protected override readonly model: Model<IComment>) {
    super(model);
  }

    async findByJti(jti: string) {
    return this.model.findOne({ jti }).exec();
  } 
  
}
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";
import { IPost } from "../models/post.model";

export class PostRepository extends DatabaseRepository<IPost> {
  constructor(protected override readonly model: Model<IPost>) {
    super(model);
  }

    async findByJti(jti: string) {
    return this.model.findOne({ jti }).exec();
  } 
  
}
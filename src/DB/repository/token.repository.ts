import { DatabaseRepository } from "./database.repository";
import { IToken } from "../models/token.model";
import { Model } from "mongoose";

export class TokenRepository extends DatabaseRepository<IToken> {
  constructor(protected override readonly model: Model<IToken>) {
    super(model);
  }

    async findByJti(jti: string) {
    return this.model.findOne({ jti }).exec();
  } 
  
}


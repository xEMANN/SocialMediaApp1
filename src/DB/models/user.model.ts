import { HydratedDocument, model, models,  Schema, Types } from "mongoose";
import { generateHash } from "../../Utils/security/hash";
import { emailEvent } from "../../Utils/events/email.events";

export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum RoleEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  username?: string;
  slug: string;
  
  email: string;
  confirmEmailOTP?: string;
  confirmedAt?: Date;
  changeCredientialsTime: Date;

  password: string;
  resetPasswordOTP?: string;

  phone?: string;
  address?: string;
  gender: GenderEnum;
  role: RoleEnum;
  profileImage: string;

  createdAt: Date;
  updatedAt?: Date;
  friends?: Types.ObjectId;
}


export const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true, minLength: 2, maxLength: 25 },
  lastName: { type: String, required: true, minLength: 2, maxLength: 25 },
  slug: { type: String, required: true, minLength: 2, maxLength: 50 },
  email: { type: String, required: true, unique: true },
  confirmEmailOTP: String,
  confirmedAt: Date,
  changeCredientialsTime: Date,
  password: { type: String, required: true },
  resetPasswordOTP: String,
  phone: String,
  address: String,
  profileImage: String,
  gender: {
    type: String,
    enum: Object.values(GenderEnum),
    default: GenderEnum.MALE,
  },
  role: {
    type: String,
    enum: Object.values(RoleEnum),
    default: RoleEnum.USER,
  },
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  ]
},
{timestamps: true, toJSON: { virtuals: true } }
);
userSchema
.virtual("username")
.set(function (value: string) {
   const [firstName, lastName] = value.split(" ") || [];
   this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
 })
.get(function () {
    return `${this.firstName} ${this.lastName}`;
 });

/*userSchema.pre(["findOneAndUpdate", "updateOne"], async function (this: any) {
    const query = this.getQuery();
    const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    if (update.freezedAt) {
        this.setUpdate({ ...update, $set: { changeCredientialsTime: new Date() } });
        const tokenModel = new TokenRepository(TokenModel);
        await tokenModel.deleteMany({ filter: { userId: query._id } });
    }
    console.log({ query, update });
});
*/

/*userSchema.post(["findOneAndUpdate", "updateOne"], async function (this: any) {

    const query = this.getQuery();
    const update = this.getUpdate() as UpdateQuery<HUserDocument>;

    if (update["$set"]?.changeCredientialsTime) {
        const tokenModel = new TokenRepository(TokenModel);
        await tokenModel.deleteMany({ filter: { userId: query._id } });
    }
});
*/

/*userSchema.pre(["findOneAndDelete", "deleteOne"], async function (this: any) {
    const query = this.getQuery();
    const tokenModel = new TokenRepository(TokenModel);
    await tokenModel.deleteMany({ filter: { userId: query._id } });
});
*/

/*userSchema.pre("insertMany", async function (docs: any[]) {
    if (Array.isArray(docs)) {
        for (const doc of docs) {
            if (doc.password) {
                doc.password = await generateHash(doc.password);
            }
        }
    }
});
*/

userSchema.pre("save", async function (this: any) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await generateHash(this.password);
    }
    if (this.isModified("confirmEmailOTP")) {
        this.confirmEmailPlainOTP = this.confirmEmailOTP as string;
        this.confirmEmailOTP = await generateHash(this.confirmEmailOTP as string);
    }
});

userSchema.post("save", async function (this: any) {
    if (this.wasNew && this.confirmEmailPlainOTP) {
        emailEvent.emit("confirmEmail", {
            to: this.email,
            username: this.username,
            otp: this.confirmEmailPlainOTP
        });
    }
});
export const UserModel = models.User || model("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
import { Request, Response } from "express";
import { IConfirmEmailDto  } from "./auth.dto";
import { UserModel } from "../../DB/models/user.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../Utils/response/error.response";
import { ILoginDTO } from "./auth.dto";
import { UserRepository } from "../../DB/repository/user.repository";
import { compareHash } from "../../Utils/security/hash";
import { generateOtp } from "../../Utils/generateOtp";
import { createLoginCredentials } from "../../Utils/security/token";

class AuthenticationService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  signup = async (req: Request, res: Response): Promise<Response> => {
    const { username, email, password, gender } = req.body as any;
    const checkUser = await this._userModel.findOne({ filter: { email }, select: "email" });
    if (checkUser) throw new ConflictException("User Already Exists");
    const otp = generateOtp();
    const user = await this._userModel.createUser({ 
        data: [
            { 
                username,
                email,
                password, 
                gender,
                confirmEmailOTP: `${otp}`,
            }
        ], options: { validateBeforeSave: true }}) || [];
    return res.status(201).json({ message: "User Created Successfully", user });
};


  login = async (req: Request, res: Response) => {
   const { email, password }: ILoginDTO = req.body;
   const user = await this._userModel.findOne({
    filter: { email },
   });

   if (!user) throw new NotFoundException("User Not Found");

   if (!user.confirmedAt) throw new BadRequestException("Verify Your Account");

   if (!(await compareHash(password, user.password)))
    throw new BadRequestException("Invalid Password");

    const credentials = await createLoginCredentials(user as any);

    return res.status(200).json({ 
        message: "User Logged in Successfully",
        credentials: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token
        },   
    });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } : IConfirmEmailDto = req.body;

  const user = await this._userModel.findOne({
    filter:{
      email,
      confirmEmailOTP: {$exists: true},
      confirmedAt: {$exists: false},
    },
  });

  if (!user) throw new NotFoundException("User Not Found");

  if (!compareHash(otp, user?.confirmEmailOTP as string)) {
    throw new BadRequestException("Invalid OTP");
  }

  await this._userModel.updateOne({
    filter: {email},
    update: { confirmedAt: new Date(), $unset: { confirmEmailOTP: true } },
  });

  return res.status(200).json({ message: "User confirmed successfully"});
  
 };


}
export default new AuthenticationService();
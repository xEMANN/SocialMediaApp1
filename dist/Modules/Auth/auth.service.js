"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/models/user.model");
const error_response_1 = require("../../Utils/response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const hash_1 = require("../../Utils/security/hash");
const generateOtp_1 = require("../../Utils/generateOtp");
const token_1 = require("../../Utils/security/token");
class AuthenticationService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        const { username, email, password, gender } = req.body;
        const checkUser = await this._userModel.findOne({ filter: { email }, select: "email" });
        if (checkUser)
            throw new error_response_1.ConflictException("User Already Exists");
        const otp = (0, generateOtp_1.generateOtp)();
        const user = await this._userModel.createUser({
            data: [
                {
                    username,
                    email,
                    password,
                    gender,
                    confirmEmailOTP: `${otp}`,
                }
            ], options: { validateBeforeSave: true }
        }) || [];
        return res.status(201).json({ message: "User Created Successfully", user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user)
            throw new error_response_1.NotFoundException("User Not Found");
        if (!user.confirmedAt)
            throw new error_response_1.BadRequestException("Verify Your Account");
        if (!(await (0, hash_1.compareHash)(password, user.password)))
            throw new error_response_1.BadRequestException("Invalid Password");
        const credentials = await (0, token_1.createLoginCredentials)(user);
        return res.status(200).json({
            message: "User Logged in Successfully",
            credentials: {
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token
            },
        });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmEmailOTP: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user)
            throw new error_response_1.NotFoundException("User Not Found");
        if (!(0, hash_1.compareHash)(otp, user?.confirmEmailOTP)) {
            throw new error_response_1.BadRequestException("Invalid OTP");
        }
        await this._userModel.updateOne({
            filter: { email },
            update: { confirmedAt: new Date(), $unset: { confirmEmailOTP: true } },
        });
        return res.status(200).json({ message: "User confirmed successfully" });
    };
}
exports.default = new AuthenticationService();

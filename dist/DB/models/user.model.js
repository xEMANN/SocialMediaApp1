"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.userSchema = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_1 = require("../../Utils/security/hash");
const email_events_1 = require("../../Utils/events/email.events");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["MALE"] = "MALE";
    GenderEnum["FEMALE"] = "FEMALE";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["USER"] = "USER";
    RoleEnum["ADMIN"] = "ADMIN";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
exports.userSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        }
    ]
}, { timestamps: true, toJSON: { virtuals: true } });
exports.userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.userSchema.pre("save", async function () {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, hash_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOTP")) {
        this.confirmEmailPlainOTP = this.confirmEmailOTP;
        this.confirmEmailOTP = await (0, hash_1.generateHash)(this.confirmEmailOTP);
    }
});
exports.userSchema.post("save", async function () {
    if (this.wasNew && this.confirmEmailPlainOTP) {
        email_events_1.emailEvent.emit("confirmEmail", {
            to: this.email,
            username: this.username,
            otp: this.confirmEmailPlainOTP
        });
    }
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", exports.userSchema);

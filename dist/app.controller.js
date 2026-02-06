"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const node_path_1 = __importDefault(require("node:path"));
const auth_controller_1 = __importDefault(require("./Modules/Auth/auth.controller"));
const error_response_1 = require("./Utils/response/error.response");
const connection_1 = __importDefault(require("./DB/connection"));
const user_controller_1 = __importDefault(require("./Modules/User/user.controller"));
const s3_config_1 = require("./Utils/multer/s3.config");
const node_util_1 = require("node:util");
const xoauth2_1 = require("nodemailer/lib/xoauth2");
(0, dotenv_1.config)({ path: node_path_1.default.resolve("./config/.env.dev") });
const post_controller_1 = __importDefault(require("./Modules/post/post.controller"));
const gateway_1 = require("./Modules/gateway/gateway");
const chat_controller_1 = __importDefault(require("./Modules/chat/chat.controller"));
const createS3WriteStreamPipe = (0, node_util_1.promisify)(xoauth2_1.pipeline);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        status: 429,
        message: "Too Many Requests,Please Tty again later",
    },
});
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)());
    app.use(limiter);
    await (0, connection_1.default)();
    app.get("/uploads/pre-signed*path", async (_req, _res) => {
        const { path } = _req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.creatGetePresignedURL)({ Key });
        return _res.status(200).json({ message: "Done", url });
    });
    app.get("/uploads/*path", async (_req, _res) => {
        const { downloadName } = _req.query;
        const { path } = _req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response.Body) {
            throw new error_response_1.BadRequestException("Fail to fetch asset");
        }
        if (downloadName) {
            _res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
        }
        _res.setHeader("Content-Type", s3Response.ContentType || "application/octet-stream");
        return await createS3WriteStreamPipe(s3Response.Body, _res);
    });
    app.get("/test-s3", async (req, res) => {
        const { Key } = req.query;
        const results = await (0, s3_config_1.deleteFile)({ Key: Key });
        return res.status(200).json({ message: "Done", results });
    });
    app.get("/test", async (_req, res) => {
        const results = await (0, s3_config_1.deleteFiles)({
            urls: [
                "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/1e175cc8-0ee4-4f18-86e2-dce20159607d-pc wallpaper.jpg",
                "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/7ec8d423-2d4a-43a0-bd8c-21ece9fd8bac-download (5).jpg",
                "SOCIAL_MEDIA_APP/users/697b2aa1cdb90ecb47b02aa2/cover/e2226259-104d-41ec-b044-9a0b4d290d70-𝓫𝓵𝓾𝓮.jpg"
            ],
        });
        return res.status(200).json({ message: "Done", results });
    });
    app.get("/", (_req, res) => {
        res.status(200).json({ message: "Welcome To Social Media App" });
    });
    app.use("/api/v1/auth", auth_controller_1.default);
    app.use("/api/v1/user", user_controller_1.default);
    app.use("/api/v1/chat", chat_controller_1.default);
    app.use("/api/user", user_controller_1.default);
    app.use("/api/v1/post", post_controller_1.default);
    app.use('/chat', chat_controller_1.default);
    app.use("/", (_req, res) => {
        res.status(404).json({ message: "Not Found Handler" });
    });
    app.use(error_response_1.globalErrorHandler);
    const httpServer = app.listen(port, () => {
        console.log(`Server Is Runing on port ${port}`);
    });
    (0, gateway_1.intialize)(httpServer);
};
exports.bootstrap = bootstrap;
exports.default = exports.bootstrap;

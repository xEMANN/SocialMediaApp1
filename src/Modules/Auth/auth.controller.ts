import { Router } from "express";
import authService from "./auth.service";
import { confirmEmailSchema, signUpSchema } from "./auth.validation";
import { validation } from "../../Middlewares/validation.middleware";

const router: Router = Router();

router.post("/signup", validation(signUpSchema, authService.signup));
router.post("/login", authService.login);
router.patch("/confirm-email", validation(confirmEmailSchema, authService.confirmEmail));

export default router;
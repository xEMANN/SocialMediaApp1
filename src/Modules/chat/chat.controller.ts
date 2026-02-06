import { Router } from "express";
import * as validators from "./chat.validation";
import { ChatService } from "./chat.service";
import { authentication } from "../../Middlewares/authentication.middleware";
import { validation } from "../../Middlewares/validation.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { endpoint } from "./chat.auzorization";

const router: Router = Router({
    mergeParams: true,
});

router.get("/", 
    authentication(TokenTypeEnum.ACCESS, endpoint.getChat),
    validation(validators.getChatSchema, ChatService.getChat) 
);

router.post("/group", 
    authentication(TokenTypeEnum.ACCESS, endpoint.getChat),
    validation(validators.createGroupChatSchema, ChatService.createGroupChat)
);

router.get("/group/:groupId", 
    authentication(TokenTypeEnum.ACCESS, endpoint.getChat),
    validation(validators.getGroupChatSchema, ChatService.getGroupChat)
);

export default router;
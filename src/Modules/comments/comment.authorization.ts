import { RoleEnum } from "../../DB/models/user.model";

export const endpoint = {
    createComment: [RoleEnum.USER, RoleEnum.ADMIN],
};  
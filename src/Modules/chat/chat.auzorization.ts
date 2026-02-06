import { RoleEnum } from "../../DB/models/user.model";

export const endpoint = {
    getChat : [RoleEnum.USER, RoleEnum.ADMIN]
}
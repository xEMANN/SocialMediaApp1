import z from "zod";
import { generalFields } from "../../Middlewares/validation.middleware";

export const getChatSchema = {
    params: z.strictObject({
        userId: generalFields.id,
    }),
};

export const getGroupChatSchema = {
    params: z.strictObject({
        groupId: generalFields.id,
    }),
};

export const createGroupChatSchema = {
    body: z
        .strictObject({
            participants: z.array(generalFields.id).min(1),
            group: z.string().min(1).max(100),
        })
        .superRefine((data, ctx) => {
            if (
                data.participants?.length &&
                data.participants.length !== [...new Set(data.participants)].length
            ) {
                ctx.addIssue({
                    code: "custom",
                    path: ["participants"],
                    message: "Please Provide unique participants",
                });
            }
        }),
};
export const sendGroupMessageSchema = {
    body: z.strictObject({
        content: z.string().min(1, { message: "Message cannot be empty" }),
        groupId: generalFields.id
    })
};
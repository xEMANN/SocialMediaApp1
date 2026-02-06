import { createTransport, Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export const sendEmail = async (data: Mail.Options) => {
  const transporter: Transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });


const mailInfo = await transporter.sendMail({
  ...data,
  from: `"Route Academy" <${process.env.EMAIL}>`,
});

console.log("Email Sent. Message ID:", mailInfo.messageId);
};


import nodeMailer from "nodemailer";
import getEnvVar from "./util";

export default async function sendMail(email: any, subject: any, text: any) {
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: getEnvVar("EMAIL"),
            pass: getEnvVar("PASSWORD"),
        },
    });
    const options = {
        to: email,
        subject: subject,
        html: text,
    };
    transporter.sendMail(options, (error, result) => {
        if (error) {
        } else {
            console.log("Mail sent:", result.response);
        }
    });
}

export async function sendErrorMail(email: any, subject: any, text: any) {
    return new Promise((resolve, reject) => {
        const transporter = nodeMailer.createTransport({
            service: "gmail",
            auth: {
                user: getEnvVar("EMAIL"),
                pass: getEnvVar("PASSWORD"),
            },
        });
        /**
         * Multiple email ids
         */
        const MailList = ["axy@gmail.com", "abc@gmail.com", "123@gmail.com"];
        const options = {
            to: MailList,
            subject: subject,
            html: text,
        };
        transporter.sendMail(options, (error, result) => {
            if (error) {
                reject(() => {
                    console.log(error);
                });
            } else {
                resolve(() => {
                    console.log("Mail sent:", result.response);
                });
            }
        });
    });
}

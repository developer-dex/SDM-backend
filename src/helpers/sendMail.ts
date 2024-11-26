import nodeMailer from "nodemailer";
import getEnvVar from "./util";
import fs from "fs";

export default async function sendCsvToMail(email: any, subject: any, text: any, path?: string, fileName?: string) {
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: getEnvVar("EMAIL"),
            pass: getEnvVar("PASSWORD"),
        },
    });


    const mailOptions = {
        from: getEnvVar("EMAIL"),
        to: email,
        subject: subject,
        text: text,
        attachments: [
            {
                filename: fileName,
                path: path,
            },
        ],
    };
    transporter.sendMail(mailOptions, (error, result) => {
        if (error) {
            fs.unlinkSync(path);
            console.log("email error", error)
        } else {
            fs.unlinkSync(path);
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

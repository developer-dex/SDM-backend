import nodeMailer from "nodemailer";
import getEnvVar from "./util";
import fs from "fs";
import { executeQuery } from "../config/databaseConfig";

export default async function sendCsvToMail(email: any, subject: any, text: any, path?: string, fileName?: string) {

    const adminEmailConfigQuery = `SELECT * FROM AdminEmailConfig WHERE id = 1`;
    const adminEmailConfig = await executeQuery(adminEmailConfigQuery);

    console.log(adminEmailConfig.rows[0]);
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: adminEmailConfig.rows[0].SenderEmail,
            pass: adminEmailConfig.rows[0].Password,
        },
    });


    const mailOptions = {
        from: adminEmailConfig.rows[0].SenderEmail,
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

export async function sendMultipleCsvToMail(email: any, subject: any, text: any, attachments: any, myEmail: string, myPassword: string) {
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: myEmail,
            pass: myPassword,
        },
    });


    const mailOptions = {
        from: myEmail,
        to: email,
        subject: subject,
        text: text,
        attachments: attachments,
    };
    transporter.sendMail(mailOptions, (error, result) => {
        if (error) {
            attachments.forEach(attachment => {
                fs.unlinkSync(attachment.path);
            });
            console.log("email error", error)
        } else {
            attachments.forEach(attachment => {
                fs.unlinkSync(attachment.path);
            });
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

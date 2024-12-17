import User from "../../models/User";
import bcryptjs from "bcryptjs";
import {
    IForgetPasswordRequest,
    ILoginResponse,
    IResetPasswordRequest,
    ISignUpRequest,
} from "./auth.interface";
import { JwtService } from "../../helpers/jwt.service";
import getEnvVar, {
    generateRandomString,
    parseTimeInterval,
} from "../../helpers/util";
import ResetPassword from "../../models/ResetPassword";
import { mailConfig } from "../../config/mail";
import sendMail from "../../helpers/sendMail";
import mongoose from "mongoose";
import {
    RESET_PASSWORD_FRONT_URL,
    } from "../../helpers/constants";
import { Request, Response } from "express";
import { executeQuery, retrieveData } from "../../config/databaseConfig";

export class AuthService {
    private jwtService: JwtService;
    constructor() {
        this.jwtService = new JwtService();
    }

    login = async (userId: number, databaseName: string, ipAddress: string, uuid: string): Promise<ILoginResponse> => {
        // Update the ipAddress in the Users table
        const updateIpAddressQuery = `UPDATE Users SET ipAddress = '${ipAddress}' WHERE id = '${userId}'`;
        await executeQuery(updateIpAddressQuery);
        return this.generateLogInSignUpResponse(userId, databaseName, uuid);
    };

    signUp = async (signUpReqPayload: ISignUpRequest) => {
        const createUserQuery = `INSERT INTO Users (full_name, email, password, databaseName, ipAddress, mobileNumber) VALUES ('${signUpReqPayload.full_name}', '${signUpReqPayload.email}', '${bcryptjs.hashSync(signUpReqPayload.password)}', 'DEMODATA', '${signUpReqPayload.ipAddress}', '${signUpReqPayload.mobileNumber}')`;
        await executeQuery(createUserQuery);

        const newUserDetailsQuery = `SELECT * FROM Users WHERE email = '${signUpReqPayload.email}'`;
        const newUserDetails = await executeQuery(
                        newUserDetailsQuery
        );
        return this.generateLogInSignUpResponse(newUserDetails.rows[0].id, newUserDetails.rows[0].databaseName,newUserDetails.rows[0].uuid);
    };

    forgetPassword = async (
        forgetPasswordReqPayload: IForgetPasswordRequest,
        userId: number
    ) => {
        await this.deleteResetPasswordRecord(forgetPasswordReqPayload.email);

        const forgotPasswordToken = generateRandomString(
            mailConfig.passwordResetTokenLength
        );

        const forgotPasswordURl = `${RESET_PASSWORD_FRONT_URL}/${forgotPasswordToken}`;

        const createResetPasswordQuery = `INSERT INTO ResetPassword (userId, email, token, expired_at) VALUES (${userId}, '${forgetPasswordReqPayload.email}', '${forgotPasswordToken}', DATEADD(HOUR, 1, GETDATE()))`;

        console.log("createResetPasswordQuery:::", createResetPasswordQuery);
        await executeQuery(createResetPasswordQuery);
           

        const emailData = {
            email: forgetPasswordReqPayload.email,
            subject: "Reset Password",
            text: `Please click the link below to reset your password: ${forgotPasswordURl}`,
        };

        console.log("emailData:::", emailData);

        this.sendEmail(emailData);
    };

    resetPassword = async (
        resetPasswordReqPayload: IResetPasswordRequest,
        email: string
    ) => {
        const updateUserPasswordQuery = `UPDATE Users SET password = '${bcryptjs.hashSync(resetPasswordReqPayload.new_password)}' WHERE email = '${email}'`;
        await executeQuery(updateUserPasswordQuery);
        await this.deleteResetPasswordRecord(email);
    };

    isExistUser = async (email: string) => {
        const query = `SELECT * FROM Users WHERE email = '${email}'`;
        const user = await retrieveData(query);
        return user;
    };

    passwordMatch = async (password: string, hashedPassword: string) => {
        return bcryptjs.compareSync(password, hashedPassword);
    };

    private sendEmail = (emailData: Record<string, any>) => {
        console.log("emailData:::", emailData);
        // TODO: send email
        sendMail(emailData.email, emailData.subject, emailData.text);
    };

    isValidResetPasswordRequest = async (token: string) => {
        const query = `SELECT * FROM ResetPassword WHERE token = '${token}'`;
        const resetPasswordRecord = await retrieveData(
                        query
        );
        return resetPasswordRecord.rows[0];
    };

    private deleteResetPasswordRecord = async (email: string) => {
        const deleteResetPasswordQuery = `DELETE FROM ResetPassword WHERE email = '${email}'`;
        await executeQuery(deleteResetPasswordQuery);
        // return await ResetPassword.deleteOne({ email });
    };

    private generateLogInSignUpResponse = (userId: number, databaseName?: string, uuid?: string) => {
        let jwtTokenPayload: Record<string, any> = {
            id: userId,
            databaseName: databaseName || null
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
            redirect_url: getEnvVar("DASHBOARD_URL") + `/${uuid}`,
            user_uuid: uuid
        };
    };
}

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
import { RESET_PASSWORD_FRONT_URL } from "../../helpers/constants";
import { Request, Response } from "express";

export class AuthService {
    private jwtService: JwtService;
    constructor() {
        this.jwtService = new JwtService();
    }

    login = async (
        userId: string,
    ): Promise<ILoginResponse> => {
        return this.generateLogInSignUpResponse(userId);
    };

    signUp = async (signUpReqPayload: ISignUpRequest) => {
        const newUser = await User.create({
            ...signUpReqPayload,
            password: bcryptjs.hashSync(signUpReqPayload.password),
        });
        return this.generateLogInSignUpResponse(newUser._id.toString());
    };

    forgetPassword = async (
        forgetPasswordReqPayload: IForgetPasswordRequest,
        userId: mongoose.Types.ObjectId
    ) => {
        await this.deleteResetPasswordRecord(forgetPasswordReqPayload.email);

        const forgotPasswordToken = generateRandomString(
            mailConfig.passwordResetTokenLength
        );

        const forgotPasswordURl = `${RESET_PASSWORD_FRONT_URL}/${forgotPasswordToken}`;

        await ResetPassword.create({
            userId,
            email: forgetPasswordReqPayload.email,
            token: forgotPasswordToken,
            expired_at: new Date(
                Date.now() +
                    parseTimeInterval(mailConfig.passwordResetTokenExpire).ms
            ),
        });

        const emailData = {
            email: forgetPasswordReqPayload.email,
            subject: "Reset Password",
            text: `Please click the link below to reset your password. <a href=${forgotPasswordURl}>${forgotPasswordURl}</a>`,
        };

        this.sendEmail(emailData);
    };

    resetPassword = async (
        resetPasswordReqPayload: IResetPasswordRequest,
        email: string
    ) => {
        await User.updateOne(
            { email },
            {
                password: bcryptjs.hashSync(
                    resetPasswordReqPayload.new_password
                ),
            }
        );
        await this.deleteResetPasswordRecord(email);
    };

    isExistUser = async (email: string) => {
        const user = await User.findOne({ email });
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
        return await ResetPassword.findOne({ token });
    };

    private deleteResetPasswordRecord = async (email: string) => {
        return await ResetPassword.deleteOne({ email });
    };

    private generateLogInSignUpResponse = (userId: string) => {
        let jwtTokenPayload: Record<string, any> = {
            _id: userId,
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
            redirect_url: getEnvVar("DASHBOARD_URL"),
        };
    };
}

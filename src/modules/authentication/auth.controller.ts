import { NextFunction, Request, Response } from "express";
import {
    IForgetPasswordRequest,
    ILoginRequest,
    IResetPasswordRequest,
    ISignUpRequest,
} from "./auth.interface";
import { AuthService } from "./auth.service";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";

export class AuthController {
    private authService: AuthService;
    private responseService: ResponseService;

    constructor() {
        this.authService = new AuthService();
        this.responseService = new ResponseService();
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        const requestData: ILoginRequest = req.body;
        try {
            const isExistUser = await this.authService.isExistUser(
                requestData.email
            );
            console.log("isExistUser", isExistUser);
            if (!isExistUser) {
                return res
                    .status(200)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.FORBIDDEN,
                            "User dose not exist"
                        )
                    );
            }
            const isPasswordCorrect = this.authService.passwordMatch(
                requestData.password,
                isExistUser.password
            );
            if (!isPasswordCorrect) {
                return res
                    .status(StatusCodes.OK)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.NOT_ACCEPTABLE,
                            "Incorrect password"
                        )
                    );
            }
            const responseData = await this.authService.login(
                isExistUser._id.toString()
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Login successfully",
                        responseData
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    signup = async (req: Request, res: Response, next: NextFunction) => {
        const requestData: ISignUpRequest = req.body;
        try {
            const isExistUser = await this.authService.isExistUser(
                requestData.email
            );
            if (isExistUser) {
                return res
                    .status(403)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.FORBIDDEN,
                            "User already exist"
                        )
                    );
            }
            const signUpToken = await this.authService.signUp(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Signup successfully",
                        signUpToken
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    forgetPassword = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const requestData: IForgetPasswordRequest = req.body;
        try {
            const isExistUser = await this.authService.isExistUser(
                requestData.email
            );
            await this.authService.forgetPassword(requestData, isExistUser._id);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Forget password successfully"
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const requestData: IResetPasswordRequest = req.body;
        try {
            const isValidRequest =
                await this.authService.isValidResetPasswordRequest(
                    requestData.reset_password_token
                );
            if (!isValidRequest) {
                return res
                    .status(403)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.FORBIDDEN,
                            "This link has been expired. Please try again"
                        )
                    );
            }
            await this.authService.resetPassword(
                requestData,
                isValidRequest.email
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Reset password successfully"
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };
}

export const authController = new AuthController();

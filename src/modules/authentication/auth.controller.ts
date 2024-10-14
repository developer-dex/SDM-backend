import { NextFunction, Request, Response } from "express";
import { ILoginRequest } from "./auth.interface";
import { AuthService } from "./auth.service";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";

export class AuthController {
    constructor(
        private authService = new AuthService(),
        private responseService = new ResponseService()
    ) {}

    async login(req: Request, res: Response, next: NextFunction) {
        const requestData: ILoginRequest = req.body;
        try {
            await this.authService.logIn(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Login successfully"
                    )
                );
        } catch (error) {
            return next(error);
        }
    }
}

export const authController = new AuthController();

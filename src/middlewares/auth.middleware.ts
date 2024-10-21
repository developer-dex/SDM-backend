import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../helpers/response.service";
import { ReasonMessage, StatusCodes } from "../common/responseStatusEnum";
import getEnvVar from "../helpers/util";
import User from "../models/User";

export class AuthMiddleware {
    constructor(private responseService = new ResponseService()) {}

    verifyjwtToken = async(
        req: Request & { token_payload?: any, user: any },
        res: Response,
        next: NextFunction
    ) => {
        const token = req.headers["authorization"];
        if (!token) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.BAD_REQUEST,
                        ReasonMessage.BAD_REQUEST
                    )
                );
        }
        try {
            const decoded = jwt.verify(token, getEnvVar("JWT_SECRETKEY"));
            req.token_payload = decoded;
            const user = await User.findById(decoded['data']._id);
            req.user = user;
        } catch (err) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.UNAUTHORIZED,
                        ReasonMessage.UNAUTHORIZED
                    )
                );
        }
        return next();
    };
}

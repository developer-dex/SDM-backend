import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../helpers/response.service";
import { ReasonMessage, StatusCodes } from "../common/responseStatusEnum";
import getEnvVar from "../helpers/util";

export class AuthMiddleware {
    constructor(private responseService = new ResponseService()) {}

    verifyjwtToken = (
        req: Request & { token_payload?: any },
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
            const decoded = jwt.verify(token, getEnvVar("JWT_SECRET"));
            req.token_payload = decoded;
            req["token"] = token;
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

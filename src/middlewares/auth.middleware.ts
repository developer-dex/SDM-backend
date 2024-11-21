import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../helpers/response.service";
import { ReasonMessage, StatusCodes } from "../common/responseStatusEnum";
import getEnvVar from "../helpers/util";
import User from "../models/User";
import { executeSqlQuery, retrieveData } from "../config/databaseConfig";

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
            // console.log("decoded:::",decoded);
            // const query = `SELECT * FROM ${decoded['data'].databaseName}.Users WHERE id = ${decoded['data'].id}`;
            // const user = await retrieveData(query);
            // if(user.length !== 0){
            //     req.user = user[0];
            // }
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

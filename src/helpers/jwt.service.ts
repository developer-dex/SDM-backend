import jwt from "jsonwebtoken";
import getEnvVar from "./util";

export class JwtService {
    constructor() {}

    public generateToken = (payload: Object) => {
        return jwt.sign(
            {
                data: payload,
            },
            `${getEnvVar("JWT_SECRETKEY")}`,
            {
                expiresIn: getEnvVar("JWT_EXPIRE"),
            }
        );
    };
}

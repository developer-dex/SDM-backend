import { Router } from "express";
import { scheduleDemoRequest } from "../modules/scheduleDemo/scheduleDemo.validation";
import { createValidator } from "express-joi-validation";
import { scheduleDemoController } from "../modules/scheduleDemo/scheduleDemo.controller";
import { contactUsController } from "../modules/contactUs/contactUs.controller";
import { loginRequestSchema } from "../modules/authentication/auth.validation";
import { contactUsRequest } from "../modules/contactUs/contactUs.validation";
import { authController } from "../modules/authentication/auth.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const validator = createValidator({ passError: true });

const authMiddleware = new AuthMiddleware();

const WebsiteApi: Router = Router();

WebsiteApi.post(
    "/schedule-demo-request",
    validator.body(scheduleDemoRequest),
    scheduleDemoController.scheduleDemoRequest
);

WebsiteApi.post(
    "/contact-us",
    validator.body(contactUsRequest),
    contactUsController.contactUsRequest
);

WebsiteApi.post(
    "/login",
    validator.body(loginRequestSchema),
    authController.login
);

WebsiteApi.use(authMiddleware.verifyjwtToken);

export default WebsiteApi;

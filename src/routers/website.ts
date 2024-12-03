import { Router } from "express";
import { scheduleDemoRequest } from "../modules/scheduleDemo/scheduleDemo.validation";
import { createValidator } from "express-joi-validation";
import { scheduleDemoController } from "../modules/scheduleDemo/scheduleDemo.controller";
import { contactUsController } from "../modules/contactUs/contactUs.controller";
import {
    forgetPasswordRequestSchema,
    loginRequestSchema,
    resetPasswordRequestSchema,
    signupRequestSchema,
} from "../modules/authentication/auth.validation";
import { contactUsRequest } from "../modules/contactUs/contactUs.validation";
import { authController } from "../modules/authentication/auth.controller";
import { subscriptionController } from "../modules/subscription/subscription.controller";
import { planController } from "../modules/plan/plan.controller";
import { listingPlanRequest } from "../modules/plan/plan.validation";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { getFrontImageValidation } from "../modules/websitefrontImages/websiteFrontImage.validation";
import AdminDashboardApi from "./adminDashboard";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const authMiddleware = new AuthMiddleware();

const validator = createValidator({ passError: true });
// AdminDashboardApi.use(authMiddleware.verifyjwtToken);
const WebsiteApi: Router = Router();

WebsiteApi.post(
    "/schedule-demo-request",
    validator.body(scheduleDemoRequest),
    scheduleDemoController.scheduleDemoRequest
);

WebsiteApi.get("/health-check", (req, res) => {
    res.send("Hello World");
});

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

WebsiteApi.post(
    "/signup",
    validator.body(signupRequestSchema),
    authController.signup
);

WebsiteApi.post(
    "/forget-password",
    validator.body(forgetPasswordRequestSchema),
    authController.forgetPassword
);

WebsiteApi.post(
    "/reset-password",
    validator.body(resetPasswordRequestSchema),
    authController.resetPassword
);

// Plan Routes
WebsiteApi.get(
    "/plan",
    validator.query(listingPlanRequest),
    planController.listing
);

// Subscription Routes
WebsiteApi.post("/subscription",authMiddleware.verifyjwtToken, subscriptionController.createSubscription);
WebsiteApi.post("/webhook", subscriptionController.handleSubscriptionWebhook);
WebsiteApi.get("/subscription-success", subscriptionController.subscriptionSuccess);

// Front Image Routes
WebsiteApi.get(
    "/front-image",
    validator.query(getFrontImageValidation),
    websiteFrontImageController.getFrontImage
);

export default WebsiteApi;

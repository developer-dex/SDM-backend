import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UPLOAD_PATH } from "../helpers/constants";
import { FileUploadMiddleware } from "../middlewares/fileupload.middleware";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { planController } from "../modules/plan/plan.controller";
import { createValidator } from "express-joi-validation";
import { listingPlanRequest } from "../modules/plan/plan.validation";

// TODO: admin.auth.middleware have to be added

const validator = createValidator({ passError: true });

const fileUploadMiddleware = new FileUploadMiddleware();
const uploadFrontImageMiddleware: any =
    fileUploadMiddleware.uploadWebsiteFrontImage;

const AdminDashboardApi: Router = Router();

AdminDashboardApi.patch(
    "/front-image",
    fileUploadMiddleware.uploadWebsiteFrontImage,
    websiteFrontImageController.updateFrontImage
);

AdminDashboardApi.get(
    "/front-images",
    websiteFrontImageController.getAllFrontImages
);

// Plan Routes
AdminDashboardApi.post("/plan", planController.createPlan);
AdminDashboardApi.get("/plan",validator.query(listingPlanRequest),planController.listing);
AdminDashboardApi.post("/plan/change-status", planController.changePlanStatus);

const authMiddleware = new AuthMiddleware();

// AdminDashboardApi.use(authMiddleware.verifyjwtToken);

export default AdminDashboardApi;

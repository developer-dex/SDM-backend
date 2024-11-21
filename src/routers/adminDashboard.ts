import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UPLOAD_PATH } from "../helpers/constants";
import { FileUploadMiddleware } from "../middlewares/fileupload.middleware";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { planController } from "../modules/plan/plan.controller";
import { createValidator } from "express-joi-validation";
import { listingPlanRequest } from "../modules/plan/plan.validation";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { superAdminController } from "../modules/superAdmin/superAdmin.controller";
import { addOrUpdateClientRequest, changeNotificationStatusRequest, getAllClientsRequest } from "../modules/superAdmin/superAdmin.validation";

// TODO: admin.auth.middleware have to be added

const validator = createValidator({ passError: true });

const authMiddleware = new AuthMiddleware();


const fileUploadMiddleware = new FileUploadMiddleware();
const uploadFrontImageMiddleware: any =
    fileUploadMiddleware.uploadWebsiteFrontImage;

const AdminDashboardApi: Router = Router();

AdminDashboardApi.post("/signin", superAdminController.signIn);

// Use the auth middleware before defining the routes
AdminDashboardApi.use(authMiddleware.verifyjwtToken);

// Notification Module
AdminDashboardApi.get("/notifications", superAdminController.getAllNotifications);
AdminDashboardApi.patch("/notification", validator.body(changeNotificationStatusRequest), superAdminController.changeNotificationStatus);

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

// Support Ticket Routes
AdminDashboardApi.get("/support-ticket", supportTicketController.getAllSupportTicket);
AdminDashboardApi.patch("/support-ticket", supportTicketController.changeSupportTicketStatus);




// User Management Routes
AdminDashboardApi.get("/users", validator.query(getAllClientsRequest), superAdminController.getAllClients);

AdminDashboardApi.delete("/user/:userId/delete", superAdminController.deleteClient);

AdminDashboardApi.post("/user", validator.body(addOrUpdateClientRequest), superAdminController.addClient);

AdminDashboardApi.put("/user", validator.body(addOrUpdateClientRequest), superAdminController.updateUserData);




// 
export default AdminDashboardApi;

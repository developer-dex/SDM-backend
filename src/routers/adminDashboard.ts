import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UPLOAD_PATH } from "../helpers/constants";
import { FileUploadMiddleware } from "../middlewares/fileupload.middleware";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { planController } from "../modules/plan/plan.controller";
import { createValidator } from "express-joi-validation";
import { getAllLicensesRequest, listingPlanRequest } from "../modules/plan/plan.validation";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { superAdminController } from "../modules/superAdmin/superAdmin.controller";
import {
    addOrUpdateClientRequest,
    changeNotificationStatusRequest,
    createClientRequest,
    createLicenseRequest,
    deleteClientRequest,
    deleteLicenseRequest,
    getAllClientsRequest,
    getAllusersRequest,
    updateUserRequest,
} from "../modules/superAdmin/superAdmin.validation";

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
AdminDashboardApi.get(
    "/notifications",
    superAdminController.getAllNotifications
);
AdminDashboardApi.patch(
    "/notification",
    validator.body(changeNotificationStatusRequest),
    superAdminController.changeNotificationStatus
);

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
AdminDashboardApi.get(
    "/plan",
    validator.query(listingPlanRequest),
    planController.listing
);
AdminDashboardApi.post("/plan/change-status", planController.changePlanStatus);
AdminDashboardApi.post("/offer", planController.createOffer);

// Support Ticket Routes
AdminDashboardApi.get(
    "/support-ticket",
    supportTicketController.getAllSupportTicket
);
AdminDashboardApi.patch(
    "/support-ticket",
    supportTicketController.changeSupportTicketStatus
);

// User Management Routes
AdminDashboardApi.get(
    "/users",
    validator.query(getAllusersRequest),
    superAdminController.getAllUsers
);

AdminDashboardApi.delete(
    "/user/:userId/delete",
    validator.params(deleteClientRequest),
    superAdminController.deleteUser
);

AdminDashboardApi.post(
    "/user",
    validator.body(addOrUpdateClientRequest),
    superAdminController.addClient
);

AdminDashboardApi.put(
    "/user",
    validator.body(addOrUpdateClientRequest),
    superAdminController.updateUserData
);

// Client Management routes
AdminDashboardApi.get(
    "/client",
    validator.query(getAllClientsRequest),
    superAdminController.getAllClients
);
AdminDashboardApi.post(
    "/client",
    validator.body(createClientRequest),
    superAdminController.createClient
);
AdminDashboardApi.delete(
    "/client/:companyId/delete",
    validator.params(deleteClientRequest),
    superAdminController.deleteClient
);
AdminDashboardApi.put(
    "/client",
    validator.body(createClientRequest),
    superAdminController.updateClient
);

// Licenses Management Routes
AdminDashboardApi.get(
    "/licenses",
    validator.query(getAllLicensesRequest),
    superAdminController.getAllLicenses
);
AdminDashboardApi.post(
    "/license",
    validator.body(createLicenseRequest),
    superAdminController.createLicense
);
AdminDashboardApi.delete(
    "/license/:licenseId/delete",
    validator.params(deleteLicenseRequest),
    superAdminController.deleteLicense
);
AdminDashboardApi.put(
    "/license",
    validator.body(createLicenseRequest),
    superAdminController.updateLicense
);

// Customer management routes
AdminDashboardApi.get(
    "/customer",
    // validator.query(getAllClientsRequest),
    superAdminController.getAllCustomers
);
export default AdminDashboardApi;

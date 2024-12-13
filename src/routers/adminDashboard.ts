import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UPLOAD_PATH } from "../helpers/constants";
import { FileUploadMiddleware } from "../middlewares/fileupload.middleware";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { planController } from "../modules/plan/plan.controller";
import { createValidator } from "express-joi-validation";
import {
    getAllLicensesRequest,
    listingPlanRequest,
} from "../modules/plan/plan.validation";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { superAdminController } from "../modules/superAdmin/superAdmin.controller";
import {
    addOrUpdateClientRequest,
    addSupportTicketTitleRequest,
    changeNotificationStatusRequest,
    clientDashboardRequest,
    createClientRequest,
    createFaqRequest,
    createLicenseRequest,
    createNotificationRequest,
    deleteClientRequest,
    deleteFaqRequest,
    deleteLicenseRequest,
    deleteSupportTicketTitleRequest,
    exportCsvRequest,
    notificationIdRequest,
    updateFaqRequest,
    updateSupportTicketTitleRequest,
    updateUserRequest,
} from "../modules/superAdmin/superAdmin.validation";
import { getAllSupportTicketRequest } from "../modules/supportTicket/supportTicket.validation";
import { pagination } from "../modules/clientAdmin/clientAdmin.validation";

// TODO: admin.auth.middleware have to be added

const validator = createValidator({ passError: true });

const authMiddleware = new AuthMiddleware();

const fileUploadMiddleware = new FileUploadMiddleware();
const uploadFrontImageMiddleware: any =
    fileUploadMiddleware.uploadWebsiteFrontImage;

const AdminDashboardApi: Router = Router();

AdminDashboardApi.post("/signin", superAdminController.signIn);

AdminDashboardApi.get("/dashboard", superAdminController.dashboardDetails);

AdminDashboardApi.post(
    "/export-csv",
    validator.body(exportCsvRequest),
    superAdminController.exportCsv
);

// Use the auth middleware before defining the routes
AdminDashboardApi.use(authMiddleware.verifyjwtToken);

// Notification Module

// AdminDashboardApi.patch(
//     "/notification",
//     validator.body(changeNotificationStatusRequest),
//     superAdminController.changeNotificationStatus
// );

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
AdminDashboardApi.put("/plan", planController.updatePlan);
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
    validator.query(getAllSupportTicketRequest),
    supportTicketController.getAllSupportTicket
);
AdminDashboardApi.patch(
    "/support-ticket",
    supportTicketController.changeSupportTicketStatus
);

// User Management Routes
AdminDashboardApi.get(
    "/users",
    // validator.query(getAllusersRequest),
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
    // validator.query(getAllClientsRequest),
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

// Manage support ticket titles
AdminDashboardApi.get(
    "/support-ticket-titles",
    superAdminController.getAllSupportTicketTitles
);
AdminDashboardApi.post(
    "/support-ticket-title",
    validator.body(addSupportTicketTitleRequest),
    superAdminController.addSupportTicketTitle
);
AdminDashboardApi.delete(
    "/support-ticket-title/:titleId/delete",
    validator.params(deleteSupportTicketTitleRequest),
    superAdminController.deleteSupportTicketTitle
);
AdminDashboardApi.put(
    "/support-ticket-title",
    validator.body(updateSupportTicketTitleRequest),
    superAdminController.updateSupportTicketTitle
);

// Export csv and send email in body I am getting customer email

// Audit Logs
AdminDashboardApi.post("/audit-logs", superAdminController.createAuditLog);
AdminDashboardApi.get("/audit-logs", superAdminController.getAllAuditLogs);

// Website banner management
AdminDashboardApi.post(
    "/website-banner",
    fileUploadMiddleware.uploadClientWebsiteBanner,
    websiteFrontImageController.uploadClientWebsiteBanner
);

AdminDashboardApi.get(
    "/website-banner",
    websiteFrontImageController.getClientWebsiteBanner
);
AdminDashboardApi.delete(
    "/website-banner/:bannerId/delete",
    websiteFrontImageController.deleteClientWebsiteBanner
);
AdminDashboardApi.put(
    "/website-banner",
    fileUploadMiddleware.uploadClientWebsiteBanner,
    websiteFrontImageController.updateClientWebsiteBanner
);

// Training files
AdminDashboardApi.post(
    "/training-files",
    fileUploadMiddleware.uploadTrainingFiles,
    websiteFrontImageController.addTrainingFiles
);

AdminDashboardApi.get(
    "/training-files",
    websiteFrontImageController.getTrainingFiles
);

AdminDashboardApi.delete(
    "/training-files/:fileId/delete",
    websiteFrontImageController.deleteTrainingFiles
);

AdminDashboardApi.put(
    "/training-files/:fileId/update",
    fileUploadMiddleware.uploadTrainingFiles,
    websiteFrontImageController.updateTrainingFiles
);

// Notification
AdminDashboardApi.post(
    "/notification",
    validator.body(createNotificationRequest),
    superAdminController.createNotification
);

AdminDashboardApi.get(
    "/notification",
    validator.params(pagination),
    superAdminController.getNotificationList
);

AdminDashboardApi.get(
    "/notification/:notificationId",
    validator.params(notificationIdRequest),
    superAdminController.getNotification
);

AdminDashboardApi.delete(
    "/notification/:notificationId/delete",
    validator.params(notificationIdRequest),
    superAdminController.deleteNotification
);

AdminDashboardApi.post(
    "/send-notification",
    validator.body(notificationIdRequest),
    superAdminController.sendNotification
);


// FAQ
AdminDashboardApi.get("/faq", superAdminController.getFaq);
AdminDashboardApi.post(
    "/faq",
    validator.body(createFaqRequest),
    superAdminController.createFaq
);
AdminDashboardApi.put(
    "/faq",
    validator.body(updateFaqRequest),
    superAdminController.updateFaq
);
AdminDashboardApi.delete(
    "/faq/:faqId/delete",
    validator.params(deleteFaqRequest),
    superAdminController.deleteFaq
);


// Client Dashboard
AdminDashboardApi.post("/client-dashboard", 
    validator.body(clientDashboardRequest),
    superAdminController.getClientDashboard);

// Analytics
AdminDashboardApi.get("/analytics", superAdminController.getAnalytics);

export default AdminDashboardApi;

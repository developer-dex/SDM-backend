import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { clientAdminController } from "../modules/clientAdmin/clientAdmin.controller";
import { createValidator } from "express-joi-validation";
import {
    createEmailScheduleRequest,
    createSupportTicketRequest,
    createUpdateEmailConfigurationRequest,
    paginationRequest,
    reportFromDashboardRequest,
    updateEmailScheduleRequest,
    updateSupportTicketRequest,
} from "../modules/clientAdmin/clientAdmin.validation";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";
import { FileUploadMiddleware } from "../middlewares/fileupload.middleware";

const ClientDashboardApi: Router = Router();

const validator = createValidator({ passError: true });

const fileUploadMiddleware = new FileUploadMiddleware();

const authMiddleware = new AuthMiddleware();

ClientDashboardApi.post("/login/internal", clientAdminController.loginInternal);

ClientDashboardApi.use(authMiddleware.verifyjwtToken);

// Client online status
ClientDashboardApi.get("/online-status", clientAdminController.getClientOnlineStatus);

// Client management
ClientDashboardApi.get("/client-management", clientAdminController.getClientManagement);

ClientDashboardApi.post(
    "/create-support-ticket",
    validator.body(createSupportTicketRequest),
    supportTicketController.createSupportTicket
);
ClientDashboardApi.get(
    "/get-support-ticket",
    validator.query(paginationRequest),
    supportTicketController.getSupportTicket
);
ClientDashboardApi.patch(
    "/update-support-ticket",
    validator.body(updateSupportTicketRequest),
    supportTicketController.updateSupportTicket
);

//Backup ss
ClientDashboardApi.get(
    "/backup-ss",
    validator.query(paginationRequest),
    clientAdminController.getBackupSS
);

ClientDashboardApi.get(
    "/backup-ss-counts",
    clientAdminController.getBackupSSCounts
);

//Ping and path
ClientDashboardApi.get(
    "/ping-path",
    validator.query(paginationRequest),
    clientAdminController.getPingAndpath
);

ClientDashboardApi.get(
    "/ping-path-counts",
    clientAdminController.getPingAndPathCounts
);

// Job Fire Statistics
ClientDashboardApi.get(
    "/job-fire-statistics",
    // validator.query(paginationRequest),
    clientAdminController.getJobFireStatistics
);

// Audit Trail log
ClientDashboardApi.get(
    "/audit-trail-log",
    validator.query(paginationRequest),
    clientAdminController.getAuditTrailLog
);

// User management
ClientDashboardApi.get(
    "/user",
    validator.query(paginationRequest),
    clientAdminController.getUsersList
);

ClientDashboardApi.get("/dashboard", clientAdminController.getDashboard);

// Setting API
ClientDashboardApi.get("/setting", clientAdminController.getSetting);

// Training Files
ClientDashboardApi.get(
    "/training-files",
    websiteFrontImageController.getTrainingFiles
);

// Ticket manager
ClientDashboardApi.get(
    "/ticket-manager",
    clientAdminController.getAllSupportTicketTitles
);

// Dashboard report
ClientDashboardApi.post(
    "/report-from-dashboard",
    validator.body(reportFromDashboardRequest),
    clientAdminController.getRepostFromDashboard
);

// Softwate Status
ClientDashboardApi.get(
    "/software-status",
    clientAdminController.getSoftwareStatus
);

// Notification
ClientDashboardApi.get("/notifications", clientAdminController.getNotification);

ClientDashboardApi.post("/mark-all-read", clientAdminController.markAllRead);

// Get FAQ
ClientDashboardApi.get("/faq", clientAdminController.getFaq);

ClientDashboardApi.get("/plans", clientAdminController.getPlanListing);

// Get email configuration
ClientDashboardApi.get(
    "/email-configuration",
    clientAdminController.getEmailConfiguration
);
ClientDashboardApi.patch(
    "/email-configuration",
    validator.body(createUpdateEmailConfigurationRequest),
    clientAdminController.updateEmailConfiguration
);

// Email schedueling
ClientDashboardApi.post(
    "/email-schedule",
    validator.body(createEmailScheduleRequest),
    clientAdminController.createEmailSchedule
);

ClientDashboardApi.post(
    "/email-schedule/send-email",
    clientAdminController.sendEmail
);
ClientDashboardApi.get(
    "/email-schedule",
    validator.query(paginationRequest),
    clientAdminController.getEmailSchedule
);
ClientDashboardApi.delete(
    "/email-schedule/:id/delete",
    clientAdminController.deleteEmailSchedule
);
ClientDashboardApi.put(
    "/email-schedule",
    validator.body(updateEmailScheduleRequest),
    clientAdminController.updateEmailSchedule
);

// Feedback and suggestion
ClientDashboardApi.post(
    "/feedback-and-suggestion",
    fileUploadMiddleware.uploadFeedbackAndSuggestionImage,
    clientAdminController.createFeedbackAndSuggestion
);

ClientDashboardApi.get(
    "/feedback-and-suggestion",
    clientAdminController.getFeedbackAndSuggestion
);

// Dashboard
// ClientDashboardApi.get("/dashboard", clientAdminController.getDashboard);
export default ClientDashboardApi;

import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { clientAdminController } from "../modules/clientAdmin/clientAdmin.controller";
import { createValidator } from "express-joi-validation";
import { createSupportTicketRequest, paginationRequest, updateSupportTicketRequest } from "../modules/clientAdmin/clientAdmin.validation";
import { websiteFrontImageController } from "../modules/websitefrontImages/websiteFrontImage.controller";

const ClientDashboardApi: Router = Router();

const validator = createValidator({ passError: true });

const authMiddleware = new AuthMiddleware();

ClientDashboardApi.post("/login/internal", clientAdminController.loginInternal);

ClientDashboardApi.use(authMiddleware.verifyjwtToken);

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
    validator.query(paginationRequest),
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

ClientDashboardApi.get(
    "/dashboard",
    clientAdminController.getDashboard
);

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

// Dashboard
// ClientDashboardApi.get("/dashboard", clientAdminController.getDashboard);
export default ClientDashboardApi;

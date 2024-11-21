import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { supportTicketController } from "../modules/supportTicket/supportTicket.controller";
import { clientAdminController } from "../modules/clientAdmin/clientAdmin.controller";
import { createValidator } from "express-joi-validation";
import { createSupportTicketRequest, paginationRequest } from "../modules/clientAdmin/clientAdmin.validation";

const ClientDashboardApi: Router = Router();

const validator = createValidator({ passError: true });

const authMiddleware = new AuthMiddleware();

ClientDashboardApi.use(authMiddleware.verifyjwtToken);

ClientDashboardApi.post(
    "/create-support-ticket",
    validator.body(createSupportTicketRequest),
    supportTicketController.createSupportTicket
);
ClientDashboardApi.get(
    "/get-support-ticket",
    supportTicketController.getSupportTicket
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
// ClientDashboardApi.get(
//     "/job-fire-statistics",
//     clientAdminController.getJobFireStatistics
// );

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
export default ClientDashboardApi;

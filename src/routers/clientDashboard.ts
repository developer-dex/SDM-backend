import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const ClientDashboardApi: Router = Router();

const authMiddleware = new AuthMiddleware();

// ClientDashboardApi.use(authMiddleware.verifyjwtToken);

export default ClientDashboardApi;

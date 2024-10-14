import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const AdminDashboardApi: Router = Router();

const authMiddleware = new AuthMiddleware();

// AdminDashboardApi.use(authMiddleware.verifyjwtToken);

export default AdminDashboardApi;

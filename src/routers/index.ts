import { Router } from "express";
import WebsiteApi from "./website";
import ClientDashboardApi from "./clientDashboard";
import AdminDashboardApi from "./adminDashboard";

const MainRoute = Router();

MainRoute.use("/api", WebsiteApi);
MainRoute.use("/api/client", ClientDashboardApi);
MainRoute.use("/api/admin", AdminDashboardApi); 

export default MainRoute;

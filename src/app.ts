import express from "express";
import cors from "cors";
import AppConfig from "./config/appConfig";
import MainRoute from "./routers";
import bodyParser from "body-parser";
import { SUPER_ADMIN_DATABASE, UPLOAD_PATH } from "./helpers/constants";
import connectWebsiteDatabase, { connectClientDatabase, initializeDatabase, replicateTables } from "./config/databaseConfig";

/**
 * Make express app
 */
const app: express.Application = express();
app.set("view engine", "ejs");

/**
 * Serve static files
 */
// Serve static files from the UPLOAD_PATH directory
app.use("/assets", express.static(UPLOAD_PATH));

/**
 * Website Database Connection
 */
// connectWebsiteDatabase();

// connectClientDatabase(SUPER_ADMIN_DATABASE);

// connectClientDatabasetest(SUPER_ADMIN_DATABASE);

initializeDatabase();

// replicateTables('DEMODATA', "DEMODATA3");
/**
 * Connect to SQLBASE Database
 */
// connectClientDatabase('CentralizedClientDB');

// createDatabase('CentralizedClientDBTeste');

// copyTableStructure('CentralizedClientDB', 'CentralizedClientDBTeste');

/**
 * Client Database Connection
 */
// connectClientDatabase();

app.use(bodyParser.json({ type: "application/json", limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());

/**
 * API routes
 */
app.use("/", MainRoute);

/**
 * Handle the error in middleware request validation error
 */
app.use((err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        console.log("app error", err.error);
        return res.status(400).json({
            responseStatus: "fail",
            responseCode: 400,
            responseMessage: err.error.details[0].message,
        });
    }
    next(err);
});

/**
 *  App Listing
 */
app.listen(AppConfig.port, () => {
    console.log(`Application is running on PORT ${Number(AppConfig.port)}`);
});

export default app;

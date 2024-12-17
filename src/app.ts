import express, { Router } from "express";
import cors from "cors";
import AppConfig from "./config/appConfig";
import MainRoute from "./routers";
import bodyParser from "body-parser";
import { ADMIN_PROFILE_PATH, CLIENT_WEBSITE_BANNER_PATH, FEEDBACK_AND_SUGGESTION_IMAGE_PATH, INTEGRATION_IMAGES_PATH, SUPER_ADMIN_DATABASE, TESTIMONIAL_IMAGE_PATH, TRAINING_FILES_PATH, UPLOAD_PATH } from "./helpers/constants";
import connectWebsiteDatabase, { connectClientDatabase, initializeDatabase, initializeDatabaseClient, initializeDatabasePool, initializeDatabasePool2, replicateTables } from "./config/databaseConfig";
import { databaseTestConnection } from "./config/test";
import WebsiteApi from "./routers/website";
import cron from "node-cron";
import { expiredLicenseCron, deleteExpiredNotification, expiredSubscription, autoScheduleEmails } from "./crons";

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
app.use("/assets", express.static(CLIENT_WEBSITE_BANNER_PATH));
app.use("/assets", express.static(TRAINING_FILES_PATH));
app.use("/assets", express.static(ADMIN_PROFILE_PATH));
app.use("/assets", express.static(TESTIMONIAL_IMAGE_PATH));
app.use("/assets", express.static(INTEGRATION_IMAGES_PATH));
app.use("/assets", express.static(FEEDBACK_AND_SUGGESTION_IMAGE_PATH));
/**
 * Website Database Connection
 */
// connectWebsiteDatabase();

// connectClientDatabase(SUPER_ADMIN_DATABASE);

// connectClientDatabasetest(SUPER_ADMIN_DATABASE);

// initializeDatabase(); // OLD
initializeDatabasePool2();

// databaseTestConnection();

// initializeDatabaseClient()

// replicateTables('SuperAdmin', "SuperAdmin3");
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
 * Cron Jobs every 5 seconds
 */
// cron.schedule("*/5 * * * * *", expiredLicenseCron);
// cron.schedule("*/5 * * * * *", deleteExpiredNotification);
// cron.schedule("*/5 * * * * *", expiredSubscription);
// cron.schedule("*/10 * * * * *", autoScheduleEmails)

cron.schedule("0 5 * * *", expiredLicenseCron); // First schedule at 12:05 AM every day
cron.schedule("0 15 * * *", expiredSubscription); // Second schedule at 12:15 AM every day
cron.schedule("0 1 * * *", deleteExpiredNotification); // Updated schedule at 1:00 AM every day
cron.schedule("0 19 * * *", autoScheduleEmails); // Last schedule at 7:00 PM every day

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

import { Databasetype } from "../common/interfaces";
import mongoose from "mongoose";
import getEnvVar from "../helpers/util";

const mysql = require("mysql2/promise");

export default async function connectWebsiteDatabase() {
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };

    const MongoDbDatabaseconfig: Databasetype = {
        databaseHost: getEnvVar("DATABASEHOST"),
        databaseName: getEnvVar("DATABASE_NAME"),
        databaseUrl: getEnvVar("DATABASE_URL"),
    };

    try {
        mongoose.Promise = global.Promise;
        mongoose.set("strictQuery", true);
        await mongoose.connect(
            MongoDbDatabaseconfig.databaseUrl,
            options as object
        );
        console.log("Mongo Connected");
    } catch (error) {
        console.log(error.message, error);
    }
}

// SQL connection
export async function connectClientDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: getEnvVar("SQL_HOST"),
            user: getEnvVar("SQL_USER"),
            password: getEnvVar("SQL_PASSWORD"),
            database: getEnvVar("SQL_DATABASE"),
        });
        console.log("SQL connected");
        return connection;
    } catch (error) {
        console.error("SQL connection failed:", error);
        process.exit(1);
    }
}

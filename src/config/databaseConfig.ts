import { Databasetype } from "../common/interfaces";
import mongoose from "mongoose";
import getEnvVar from "../helpers/util";
import { Connection, Request } from "tedious";

let superAdminConnection: Connection | null = null;

let connection: Connection | null = null;
let destinationConnection: Connection | null = null;


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
export async function connectClientDatabase(
    databaseName: string
): Promise<void> {
    if (superAdminConnection) return; // Return if already connected

    const config = {
        server: getEnvVar("SQLBASE_HOST"),
        authentication: {
            type: "default" as "default",
            options: {
                userName: getEnvVar("SQLBASE_USER"),
                password: getEnvVar("SQLBASE_PASSWORD"),
            },
        },
        options: {
            database: databaseName,
            encrypt: true,
            port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
            trustServerCertificate: true,
        },
    };

    superAdminConnection = new Connection(config);

    return new Promise((resolve, reject) => {
        superAdminConnection!.on("connect", (err: Error) => {
            if (err) {
                console.log("Connection error:", err);
                reject(err);
            } else {
                console.log("Connected to SQL Server.");
                resolve();
            }
        });
        superAdminConnection!.connect();
    });
}

export async function connectSourceDatabase(
    databaseName: string
): Promise<void> {
    if (connection) return; // Return if already connected

    const config = {
        server: getEnvVar("SQLBASE_HOST"),
        authentication: {
            type: "default" as "default",
            options: {
                userName: getEnvVar("SQLBASE_USER"),
                password: getEnvVar("SQLBASE_PASSWORD"),
            },
        },
        options: {
            database: databaseName,
            encrypt: true,
            port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
            trustServerCertificate: true,
        },
    };

    connection = new Connection(config);

    return new Promise((resolve, reject) => {
        connection!.on("connect", (err: Error) => {
            if (err) {
                console.log("Connection error:", err);
                reject(err);
            } else {
                console.log("Connected to SQL Server.");
                resolve();
            }
        });
        connection!.connect();
    });
}

export async function connectDestinationDatabase(
    databaseName: string
): Promise<void> {
    if (destinationConnection) return; // Return if already connected

    const config = {
        server: getEnvVar("SQLBASE_HOST"),
        authentication: {
            type: "default" as "default",
            options: {
                userName: getEnvVar("SQLBASE_USER"),
                password: getEnvVar("SQLBASE_PASSWORD"),
            },
        },
        options: {
            database: databaseName,
            encrypt: true,
            port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
            trustServerCertificate: true,
        },
    };

    destinationConnection = new Connection(config);

    return new Promise((resolve, reject) => {
        destinationConnection!.on("connect", (err: Error) => {
            if (err) {
                console.log("destinationConnection error:", err);
                reject(err);
            } else {
                console.log("Connected to SQL Server.");
                resolve();
            }
        });
        destinationConnection!.connect();
    });
}

async function getTableNames(connection: Connection): Promise<string[]> {
    const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
    return new Promise((resolve, reject) => {
        const tableNames: string[] = [];
        const request = new Request(query, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(tableNames);
            }
        });

        request.on("row", (columns) => {
            const tableName = columns[0].value;
            if (tableName) {
                tableNames.push(tableName);
            }
        });

        connection.execSql(request);
    });
}

function connectServer(): Promise<Connection> {
    const config: any = {
        server: getEnvVar("SQLBASE_HOST"),
        authentication: {
            type: 'default',
            options: {
                userName: getEnvVar("SQLBASE_USER"),
                password: getEnvVar("SQLBASE_PASSWORD"),
            }
        },
        options: {
            encrypt: true,
            port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
            trustServerCertificate: true,
        }
    };

    const connection = new Connection(config);

    return new Promise((resolve, reject) => {
        connection.on("connect", (err: Error) => {
            if (err) {
                console.log("Connection error:", err);
                reject(err);
            } else {
                console.log(`Connected to SQL Server.`);
                resolve(connection);
            }
        });
        connection.connect();
    });
}


export async function replicateTables(
    sourceDb: string,
    destinationDb: string
): Promise<void> {
    try {
        // Connect to the SQL server without specifying a database
        const serverConnection = await connectServer();

        // Create destination database if it does not exist
        await createDatabaseIfNotExists(serverConnection, destinationDb);
        // Connect to source and destination databases
        await connectSourceDatabase(sourceDb);
        await connectDestinationDatabase(destinationDb);

        // Step 1: Fetch all table names from the source database
        const tables = await getTableNames(connection);

        for (const table of tables) {
            // Step 2: Get the table schema
            const schemaQuery = `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                                 FROM INFORMATION_SCHEMA.COLUMNS 
                                 WHERE TABLE_NAME = '${table}'`;

            const columns = await new Promise<
                { name: string; type: string; length: number | null }[]
            >((resolve, reject) => {
                const columns: {
                    name: string;
                    type: string;
                    length: number | null;
                }[] = [];
                const schemaRequest = new Request(schemaQuery, (err) => {
                    if (err) reject(err);
                    else resolve(columns);
                });

                schemaRequest.on("row", (row) => {
                    columns.push({
                        name: row[0].value,
                        type: row[1].value,
                        length: row[2].value,
                    });
                });

                connection!.execSql(schemaRequest);
            });

            let createTableSQL = `CREATE TABLE ${destinationDb}.dbo.${table} (`;
            columns.forEach((column, index) => {
                createTableSQL += `${column.name} ${column.type}`;
                if (column.length) {
                    if(column.length === -1){
                        createTableSQL += `(MAX)`;
                    }
                    else{
                        createTableSQL += `(${column.length})`;
                    }
                }
                if (index < columns.length - 1) createTableSQL += ", ";
            });
            createTableSQL += ")";

            console.log("createTableSQL:::",createTableSQL);


            // Step 3: Create the table in the destination database
            await new Promise<void>((resolve, reject) => {
                const destinationRequest = new Request(
                    createTableSQL,
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
                destinationConnection!.execSql(destinationRequest);
            });

            // // Step 4: Copy data from source to destination
            // const dataQuery = `SELECT * FROM ${table}`;
            // const dataResult = await new Promise<any[]>((resolve, reject) => {
            //     const rows: any[] = [];
            //     const dataRequest = new Request(dataQuery, (err) => {
            //         if (err) reject(err);
            //         else resolve(rows);
            //     });

            //     dataRequest.on("row", (row) => {
            //         const rowData: { [key: string]: any } = {};
            //         row.forEach((column) => {
            //             rowData[column.metadata.colName] = column.value;
            //         });
            //         rows.push(rowData);
            //     });

            //     connection!.execSql(dataRequest);
            // });

            // // Insert data into the destination table
            // for (const row of dataResult) {
            //     const columns = Object.keys(row).join(", ");
            //     const values = Object.values(row)
            //         .map((value) =>
            //             typeof value === "string"
            //                 ? `'${value.replace(/'/g, "''")}'`
            //                 : value
            //         )
            //         .join(", ");

            //     const insertQuery = `INSERT INTO ${destinationDb}.dbo.${table} (${columns}) VALUES (${values})`;
            //     console.log("insertQuery:::",insertQuery);

            //     await new Promise<void>((resolve, reject) => {
            //         const insertRequest = new Request(insertQuery, (err) => {
            //             if (err) reject(err);
            //             else resolve();
            //         });
            //         destinationConnection!.execSql(insertRequest);
            //     });
            // }
        }

        console.log("Tables replicated successfully!");
    } catch (error) {
        console.error("Error replicating tables:", error);
    } finally {
        if (connection) connection.close();
        if (destinationConnection) destinationConnection.close();
    }
}

async function createDatabaseIfNotExists(serverConnection: Connection, databaseName: string): Promise<void> {
    // Wrap the database name in square brackets to prevent syntax errors with special characters
    const safeDatabaseName = `[${databaseName.replace(/]/g, ']]')}]`; // Escape any `]` characters in the name
    
    const checkDbQuery = `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${databaseName}')
                          BEGIN
                              CREATE DATABASE ${safeDatabaseName};
                          END`;

    return new Promise((resolve, reject) => {
        const request = new Request(checkDbQuery, (err) => {
            if (err) {
                console.log("Error creating database:", err);
                reject(err);
            } else {
                console.log(`Database ${databaseName} created (if not already exists).`);
                resolve();
            }
        });

        serverConnection.execSql(request);
    });
}


export async function executeSqlQuery(
    sqlQuery: string,
    databasename?: string
): Promise<void> {
    if (databasename) {
        await connectClientDatabase(databasename);
    }
    if (!superAdminConnection) {
        console.log("Database connection is not initialized.");
        return;
    }

    return new Promise((resolve, reject) => {
        const request = new Request(sqlQuery, (err) => {
            if (err) {
                console.log("Failed to execute query:", err);
                reject(err);
            } else {
                console.log("Query executed successfully.");
                resolve();
            }
        });

        superAdminConnection.execSql(request);
    });
}

export async function retrieveData(sqlQuery: string): Promise<any[]> {

    if (superAdminConnection) {
        console.log("Connection already initialized.");
        // return;
    }
    if (!superAdminConnection) {
        console.log("Database connection is not initialized.");
        return [];
    } 

    return new Promise((resolve, reject) => {
        const request = new Request(sqlQuery, (err) => {
            if (err) {
                console.log("Failed to execute query:", err);
                reject(err);
            }
        });

        const results: any[] = [];

        request.on("row", (columns) => {
            const row: any = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            results.push(row);
        });

        request.on("doneInProc", (rowCount) => {
            console.log(`Retrieved ${rowCount} rows`);
            resolve(results);
        });

        superAdminConnection.execSql(request);
    });
}
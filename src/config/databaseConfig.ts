import { Databasetype } from "../common/interfaces";
import mongoose from "mongoose";
import getEnvVar from "../helpers/util";
import { Connection, Request } from "tedious";
import { SUPER_ADMIN_DATABASE } from "../helpers/constants";

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
            type: "default",
            options: {
                userName: getEnvVar("SQLBASE_USER"),
                password: getEnvVar("SQLBASE_PASSWORD"),
            },
        },
        options: {
            encrypt: true,
            port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
            trustServerCertificate: true,
        },
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
        const serverConnection = await connectServer();
        await createDatabaseIfNotExists(serverConnection, destinationDb);
        await connectSourceDatabase(sourceDb);
        await connectDestinationDatabase(destinationDb);

        // Step 1: Fetch all table names from the source database
        const tables = await getTableNames(connection);

        for (const table of tables) {
            // Step 2: Get the table schema with keys and constraints
            const schemaQuery = `
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${table}';

                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_NAME = '${table}' AND CONSTRAINT_NAME LIKE 'PK_%';

                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_NAME = '${table}' AND CONSTRAINT_NAME LIKE 'UQ_%';

                SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
                INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE KCU
                ON RC.CONSTRAINT_NAME = KCU.CONSTRAINT_NAME
                WHERE KCU.TABLE_NAME = '${table}';
            `;

            const { columns, primaryKey, uniqueKeys, foreignKeys } = await getTableSchemaDetails(schemaQuery);

            // Step 3: Build CREATE TABLE statement
            let createTableSQL = `CREATE TABLE ${destinationDb}.dbo.${table} (`;

            columns.forEach((column, index) => {
                createTableSQL += `${column.name} ${column.type}`;
                if (column.length) {
                    if (column.length === -1) {
                        createTableSQL += `(MAX)`;
                    } else {
                        createTableSQL += `(${column.length})`;
                    }
                }
                if (column.isNullable === 'NO') {
                    createTableSQL += ` NOT NULL`;
                }
                if (index < columns.length - 1) createTableSQL += `, `;
            });

            // Add Primary Key
            if (primaryKey.length) {
                createTableSQL += `, PRIMARY KEY (${primaryKey.join(', ')})`;
            }

            // Add Unique Keys
            uniqueKeys.forEach((uniqueKey) => {
                createTableSQL += `, UNIQUE (${uniqueKey})`;
            });

            createTableSQL += `);`;

            console.log(`createTableSQL::: ${createTableSQL}`);

            // Step 4: Create the table in the destination database
            await executeQueryReplace(destinationConnection, createTableSQL);

            // Step 5: Add Foreign Keys
            for (const fk of foreignKeys) {
                const addForeignKeyQuery = `
                    ALTER TABLE ${destinationDb}.dbo.${table}
                    ADD CONSTRAINT ${fk.constraintName}
                    FOREIGN KEY (${fk.columnName})
                    REFERENCES ${destinationDb}.dbo.${fk.referencedTableName}(${fk.referencedColumnName});
                `;
                await executeQueryReplace(destinationConnection, addForeignKeyQuery);
            }
        }

        console.log("Tables replicated successfully!");
    } catch (error) {
        console.error("Error replicating tables:", error);
    } finally {
        if (connection) connection.close();
        if (destinationConnection) destinationConnection.close();
    }
}

async function getTableSchemaDetails(query: string): Promise<{
    columns: { name: string; type: string; length: number | null; isNullable: string }[];
    primaryKey: string[];
    uniqueKeys: string[];
    foreignKeys: { constraintName: string; columnName: string; referencedTableName: string; referencedColumnName: string }[];
}> {
    return new Promise((resolve, reject) => {
        const columns: { name: string; type: string; length: number | null; isNullable: string }[] = [];
        const primaryKey: string[] = [];
        const uniqueKeys: string[] = [];
        const foreignKeys: { constraintName: string; columnName: string; referencedTableName: string; referencedColumnName: string }[] = [];

        const request = new Request(query, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({ columns, primaryKey, uniqueKeys, foreignKeys });
            }
        });

        request.on("row", (row) => {
            if (row[0].metadata.colName === "COLUMN_NAME") {
                columns.push({
                    name: row[0].value,
                    type: row[1].value,
                    length: row[2].value,
                    isNullable: row[3].value,
                });
            } else if (row[0].metadata.colName.includes("PK_")) {
                primaryKey.push(row[0].value);
            } else if (row[0].metadata.colName.includes("UQ_")) {
                uniqueKeys.push(row[0].value);
            } else {
                foreignKeys.push({
                    constraintName: row[0].value,
                    columnName: row[1].value,
                    referencedTableName: row[2].value,
                    referencedColumnName: row[3].value,
                });
            }
        });

        connection.execSql(request);
    });
}

async function executeQueryReplace(connection: Connection, query: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = new Request(query, (err) => {
            if (err) reject(err);
            else resolve();
        });
        connection.execSql(request);
    });
}


async function createDatabaseIfNotExists(
    serverConnection: Connection,
    databaseName: string
): Promise<void> {
    // Wrap the database name in square brackets to prevent syntax errors with special characters
    const safeDatabaseName = `[${databaseName.replace(/]/g, "]]")}]`; // Escape any `]` characters in the name

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
                console.log(
                    `Database ${databaseName} created (if not already exists).`
                );
                resolve();
            }
        });

        serverConnection.execSql(request);
    });
}

// export async function retrieveData(sqlQuery: string): Promise<any[]> {

//     console.log("query:::::::::", sqlQuery)
//     if (superAdminConnection) {
//         console.log("Connection already initialized.");
//         // return;
//     }
//     if (!superAdminConnection) {
//         console.log("Database connection is not initialized.");
//         return [];
//     }

//     return new Promise((resolve, reject) => {
//         const request = new Request(sqlQuery, (err) => {
//             console.log("insidde query::::::", sqlQuery)
//             if (err) {
//                 console.log("Failed to execute query:", err);
//                 reject(err);
//             }
//         });

//         const results: any[] = [];

//         request.on("row", (columns) => {
//             const row: any = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             results.push(row);
//         });

//         request.on("doneInProc", (rowCount) => {
//             console.log(`Retrieved ${rowCount} rows`);
//             resolve(results);
//         });

//         superAdminConnection.execSql(request);
//     });
// }

// const connectionConfig = {
//     server: getEnvVar("SQLBASE_HOST"),
//     options: {
//         database: SUPER_ADMIN_DATABASE,
//         encrypt: true,
//         trustServerCertificate: true,
//         rowCollectionOnRequestCompletion: false,
//     },
//     authentication: {
//         type: "default",
//         options: {
//             userName: getEnvVar("SQLBASE_USER"),
//             password: getEnvVar("SQLBASE_PASSWORD"),
//             port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
//         },
//     },
// };

// const connectionConfig = {
//     server: getEnvVar("SQLBASE_HOST"),
//     authentication: {
//         type: "default" as "default",
//         options: {
//             userName: getEnvVar("SQLBASE_USER"),
//             password: getEnvVar("SQLBASE_PASSWORD"),
//         },
//     },
//     options: {
//         database: SUPER_ADMIN_DATABASE,
//         encrypt: true,
//         port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
//         trustServerCertificate: true,
//     },
// };

// async function createNewConnection(): Promise<Connection> {
//     return new Promise((resolve, reject) => {
//         const connection = new Connection(connectionConfig as ConnectionConfiguration);
//         connection.on("connect", (err) => {
//             if (err) {
//                 console.error("Failed to connect to the database:", err);
//                 return reject(err);
//             }
//             console.log("Connection is created:::::::::")
//             resolve(connection);
//         });

//         connection.connect();
//     });
// }

// export async function retrieveData(sqlQuery: string): Promise<any[]> {
//     console.log("sqlQuery:::", sqlQuery);
//     const connection = await createNewConnection(); // Create a new connection for this query
//     console.log("connectionNewNew:::", connection);
//     return new Promise((resolve, reject) => {
//         const request = new Request(sqlQuery, (err) => {
//             if (err) {
//                 console.error("Failed to execute query:", err);
//                 connection.close(); // Close the connection in case of an error
//                 return reject(err);
//             }
//         });

//         const results: any[] = [];

//         request.on("row", (columns) => {
//             const row: any = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             results.push(row);
//         });

//         request.on("doneInProc", (rowCount) => {
//             console.log(`Retrieved ${rowCount} rows`);
//             connection.close(); // Close the connection after query completion
//             resolve(results);
//         });

//         request.on("done", () => {
//             console.log("Connection is closed:::::::::")
//             connection.close(); // Ensure connection is closed after done
//         });

//         connection.execSql(request);
//     });
// }

// export async function demoData (sql: string, callback: (err: Error | null, result: { rowCount: number; rows: any[] } | null) => void) {
//     let connection = new Connection({
//       "authentication": {
//         "options": {
//           "userName": getEnvVar("SQLBASE_USER"),
//           "password": getEnvVar("SQLBASE_PASSWORD")
//         },
//         "type": "default"
//       },
//       "server": getEnvVar("SQLBASE_HOST"),
//       "options": {
//         // "validateBulkLoadParameters": false,
//         "rowCollectionOnRequestCompletion": true,
//         "database": SUPER_ADMIN_DATABASE,
//         "port": Number(getEnvVar("SQLBASE_PORT")) || 1433,
//         "encrypt": true,
//         "trustServerCertificate": true,
//       }
//     });
//     connection.connect((err) => {
//       if (err)
//         return callback(err, null);
//       const request = new Request(sql, (err, rowCount, rows) => {
//         connection.close();
//         if (err)
//           return callback(err, null);
//         callback(null, {rowCount, rows});
//       });
//       connection.execSql(request);
//     });
//   };

export function retrieveData(
    sql: string
): Promise<{ rowCount: number; rows: any[] }> {
    return new Promise((resolve, reject) => {
        const connection = new Connection({
            authentication: {
                options: {
                    userName: getEnvVar("SQLBASE_USER"),
                    password: getEnvVar("SQLBASE_PASSWORD"),
                },
                type: "default",
            },
            server: getEnvVar("SQLBASE_HOST"),
            options: {
                rowCollectionOnRequestCompletion: true,
                database: SUPER_ADMIN_DATABASE,
                port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
                encrypt: true,
                trustServerCertificate: true,
            },
        });

        connection.connect((err) => {
            if (err) {
                return reject(err);
            }

            const request = new Request(sql, (err, rowCount, rows) => {
                connection.close();
                if (err) {
                    return reject(err);
                }

                // Transform rows to a simpler array of objects
                const simplifiedRows = rows.map((row) =>
                    row.reduce((acc, column) => {
                        acc[column.metadata.colName] = column.value;
                        return acc;
                    }, {})
                );

                resolve({ rowCount, rows: simplifiedRows });
            });

            connection.execSql(request);
        });
    });
}

// export async function executeSqlQuery(
//     sqlQuery: string,
//     databasename?: string
// ): Promise<void> {
//     return new Promise((resolve, reject) => {
//         const connection = new Connection({
//             authentication: {
//                 options: {
//                     userName: getEnvVar("SQLBASE_USER"),
//                     password: getEnvVar("SQLBASE_PASSWORD"),
//                 },
//                 type: "default",
//             },
//             server: getEnvVar("SQLBASE_HOST"),
//             options: {
//                 rowCollectionOnRequestCompletion: true,
//                 database: databasename ?? SUPER_ADMIN_DATABASE,
//                 port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
//                 encrypt: true,
//                 trustServerCertificate: true,
//             },
//         });

//         const request = new Request(sqlQuery, (err) => {
//             if (err) {
//                 console.log("Failed to execute query:", err);
//                 reject(err);
//             } else {
//                 console.log("Query executed successfully.");
//                 resolve();
//             }
//         });
//         connection.execSql(request);
//     });
// }

// export async function executeSqlQuery(
//     sqlQuery: string,
//     databasename?: string
// ): Promise<void> {
//     if (databasename) {
//         await connectClientDatabase(databasename);
//     }
//     if (!superAdminConnection) {
//         console.log("Database connection is not initialized.");
//         return;
//     }

//     return new Promise((resolve, reject) => {
//         const request = new Request(sqlQuery, (err) => {
//             if (err) {
//                 console.log("Failed to execute query:", err);
//                 reject(err);
//             } else {
//                 console.log("Query executed successfully.");
//                 resolve();
//             }
//         });

//         superAdminConnection.execSql(request);
//     });
// }

export async function executeSqlQuery(
    sqlQuery: string,
    databasename?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const connection = new Connection({
        authentication: {
          options: {
            userName: getEnvVar("SQLBASE_USER"),
            password: getEnvVar("SQLBASE_PASSWORD"),
          },
          type: "default",
        },
        server: getEnvVar("SQLBASE_HOST"),
        options: {
          rowCollectionOnRequestCompletion: true,
          database: databasename ?? SUPER_ADMIN_DATABASE,
          port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
          encrypt: true,
          trustServerCertificate: true,
          connectTimeout: 15000, // Set connection timeout (15 seconds)
          requestTimeout: 15000, // Set query execution timeout (15 seconds)
        },
      });
  
      connection.on("connect", (err) => {
        if (err) {
          console.error("Database connection failed:", err);
          reject(err);
          return;
        }
  
        console.log("Connected to the database.");
  
        const request = new Request(sqlQuery, (err) => {
          connection.close(); // Always close the connection
          if (err) {
            console.error("Failed to execute query:", err);
            reject(err);
            return;
          }
  
        //   console.log("Query executed successfully.");
          resolve();
        });
  
        connection.execSql(request);
      });
  
      connection.on("error", (err) => {
        console.error("Connection error:", err);
        reject(err);
      });
  
      connection.connect(); // Initiate the connection
    });
  }

  let testConnection: Connection;
  let clientConneection: Connection;

  
  
// Initialize database connection (called once during server start)
export const initializeDatabase = () => {
    testConnection = new Connection({
      server: getEnvVar("SQLBASE_HOST"), // Replace with your server
      options: {
        database: SUPER_ADMIN_DATABASE, // Replace with your database
        encrypt: true,
        port: Number(getEnvVar("SQLBASE_PORT")) || 1440,
        trustServerCertificate: true, // Allows self-signed certificates
        connectTimeout: 30000000, // Set connection timeout (15 seconds)
        requestTimeout: 30000000, // Set query execution timeout (15 seconds)
       

      },
      authentication: {
        type: "default",
        options: {
          userName: getEnvVar("SQLBASE_USER"), // Replace with your username
          password: getEnvVar("SQLBASE_PASSWORD"), // Replace with your password
          
        },
      },
    });
  
    testConnection.on("connect", (err) => {
      if (err) {
        console.error("Database connection failed:", err);
      } else {
        console.log("Database connected successfully.");
      }
    });
  
    testConnection.connect();
  };

  export const initializeDatabaseClient = () => {
    clientConneection = new Connection({
      server: getEnvVar("SQLBASE_HOST"), // Replace with your server
      options: {
        // database: SUPER_ADMIN_DATABASE, // Replace with your database
        encrypt: true,
        port: Number(getEnvVar("SQLBASE_PORT")) || 1440,
        trustServerCertificate: true, // Allows self-signed certificates

      },
      authentication: {
        type: "default",
        options: {
          userName: getEnvVar("SQLBASE_USER"), // Replace with your username
          password: getEnvVar("SQLBASE_PASSWORD"), // Replace with your password
          
        },
      },
    });
  
    clientConneection.on("connect", (err) => {
      if (err) {
        console.error("Client Database connection failed:", err);
      } else {
        console.log("Client Database connected successfully.");
      }
    });
  
    clientConneection.connect();
  }; 

  interface QueryResult {
    rows: any[];
  }
  
//   // Query execution function
//   export const executeQuery = (query: string): Promise<QueryResult> => {
//     return new Promise((resolve, reject) => {
//       const request = new Request(query, (err, rowCount) => {
//         if (err) {
//           reject(err);
//         }
//       });
  
//       const rows: any[] = [];
//       request.on("row", (columns) => {
//         const row: any = {};
//         columns.forEach((column) => {
//           row[column.metadata.colName] = column.value;
//         });
//         rows.push(row);
//       });
  
//       request.on("requestCompleted", () => {
//         resolve({ rows });
//       });
  
//       testConnection.execSql(request);
//     });
//   };

let isQueryInProgress = false; // Flag to track query execution state

// Query execution function
// export const executeQuery = async (query: string): Promise<QueryResult> => {
//     // Wait until the previous query is completed
//     while (isQueryInProgress) {
//         await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
//     }

//     isQueryInProgress = true; // Set the flag to indicate a query is in progress

//     return new Promise((resolve, reject) => {
//         const request = new Request(query, (err, rowCount) => {
//             isQueryInProgress = false; // Reset the flag when the request is done
//             if (err) {
//                 reject(err);
//             }
//         });

//         const rows: any[] = [];
//         request.on("row", (columns) => {
//             const row: any = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             rows.push(row);
//         });

//         request.on("requestCompleted", () => {
//             resolve({ rows });
//         });

//         testConnection.execSql(request);
//     });
// };
// ... existing code ...

// Update the executeQuery function to create a new connection for each query
// export const executeQuery = async (query: string): Promise<QueryResult> => {
//     return new Promise((resolve, reject) => {
//         const connection = new Connection({
//             server: getEnvVar("SQLBASE_HOST"),
//             options: {
//                 database: SUPER_ADMIN_DATABASE,
//                 encrypt: true,
//                 port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
//                 trustServerCertificate: true,
//             },
//             authentication: {
//                 type: "default",
//                 options: {
//                     userName: getEnvVar("SQLBASE_USER"),
//                     password: getEnvVar("SQLBASE_PASSWORD"),
//                 },
//             },
//         });

//         connection.connect((err) => {
//             if (err) {
//                 return reject(err);
//             }

//             const request = new Request(query, (err) => {
//                 connection.close(); // Always close the connection
//                 if (err) {
//                     return reject(err);
//                 }
//                 console.log("Query executed successfully.");
//             });

//             const rows: any[] = [];
//             request.on("row", (columns) => {
//                 const row: any = {};
//                 columns.forEach((column) => {
//                     row[column.metadata.colName] = column.value;
//                 });
//                 rows.push(row);
//             });

//             request.on("requestCompleted", () => {
//                 resolve({ rows });
//             });

//             connection.execSql(request);
//         });
//     });
// };

// ... existing code ...


import { ConnectionPool } from "mssql";
let pool: ConnectionPool;

export const initializeDatabasePool2 = async () => {
    // let pool: ConnectionPool;
    try {
        pool = new ConnectionPool({
            server: getEnvVar("SQLBASE_HOST"),
            authentication: {
                type: "default",
                options: {
                    userName: getEnvVar("SQLBASE_USER"),
                    password: getEnvVar("SQLBASE_PASSWORD"),
                },
            },
            options: {
                database: SUPER_ADMIN_DATABASE,
                encrypt: true,
                port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
                trustServerCertificate: true,
                connectTimeout: 30000, // Increase connection timeout (30 seconds)
                requestTimeout: 30000, 
            },
        });

         await pool.connect();
        //  return pool;
        console.log("Database connected successfully.");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
};

export const executeQuery = async (query: string): Promise<QueryResult> => {
    return new Promise((resolve, reject) => {
        pool.request() // Create a new request from the pool
            .query(query, (err, result) => {
                if (err) {
                    console.log("Error in executeQuery", err);
                    return reject(err);
                }
                console.log("Query executed successfully.");
                resolve({ rows: result.recordset }); // Return the result set wrapped in an object
            });
    });
};

export const executeQuery2 = async (query: string , pool: ConnectionPool): Promise<QueryResult> => {
    console.log("Executing query:", query);
    return new Promise((resolve, reject) => {
        // pool.request() // Create a new request from the pool
            pool.query(query, (err, result) => {
                if (err) {
                    return reject(err);
                }
                // console.log("Query executed successfully.");
                resolve({ rows: result.recordset }); // Return the result set wrapped in an object
            });
    });
};

export const initializeDatabasePool = async () => {
    let pool2: ConnectionPool;
    try {
        pool2 = new ConnectionPool({
            server: getEnvVar("SQLBASE_HOST"),
            authentication: {
                type: "default",
                options: {
                    userName: getEnvVar("SQLBASE_USER"),
                    password: getEnvVar("SQLBASE_PASSWORD"),
                },
            },
            options: {
                database: SUPER_ADMIN_DATABASE,
                encrypt: true,
                port: Number(getEnvVar("SQLBASE_PORT")) || 1433,
                trustServerCertificate: true,
                connectTimeout: 30000, // Increase connection timeout (30 seconds)
                requestTimeout: 30000, 
            },
        });

         await pool2.connect();
         return pool2;
        console.log("Database connected successfully.");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
};




  export const executeQueryClient = (query: string): Promise<QueryResult> => {
    return new Promise((resolve, reject) => {
      const request = new Request(query, (err, rowCount) => {
        if (err) {
          reject(err);
        }
      });
  
      const rows: any[] = [];
      request.on("row", (columns) => {
        const row: any = {};
        columns.forEach((column) => {
          row[column.metadata.colName] = column.value;
        });
        rows.push(row);
      });
  
      request.on("requestCompleted", () => {
        resolve({ rows });
      });
  
      clientConneection.execSql(request);
    });
  };


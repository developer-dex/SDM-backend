import { Databasetype } from "../common/interfaces";
import mongoose from "mongoose";
import getEnvVar from "../helpers/util";
import { Connection, ConnectionConfiguration, Request } from "tedious";
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
                    if (column.length === -1) {
                        createTableSQL += `(MAX)`;
                    } else {
                        createTableSQL += `(${column.length})`;
                    }
                }
                if (index < columns.length - 1) createTableSQL += ", ";
            });
            createTableSQL += ")";

            console.log("createTableSQL:::", createTableSQL);

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
  
          console.log("Query executed successfully.");
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
  
  // Query execution function
  export const executeQuery = (query: string): Promise<QueryResult> => {
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
  
      testConnection.execSql(request);
    });
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


  /// Testing pooling
  import ConnectionPool from 'tedious-connection-pool';

  // Pool Configuration
const poolConfig = {
    min: 2,  // Minimum number of connections in the pool
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000 // Time before idle connection is closed
  };

  const dbConfig = {
    server: getEnvVar("SQLBASE_HOST"), // Replace with your server
    options: {
      database: SUPER_ADMIN_DATABASE, // Replace with your database
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
  }

  console.log("dbConfig: ", dbConfig);

  // Create a new connection pool
// const pool = new ConnectionPool(poolConfig, dbConfig);

// // Listen for pool events (optional)
// pool.on('error', (err) => {
//   console.error('Pool Error:', err);
// });


// Function to execute a single query
// export const executeQuery2 = (query) => {
//     return new Promise((resolve, reject) => {
//       pool.acquire((err, connection) => {
//         if (err) {
//           return reject(err);
//         }
  
//         const request = new Request(query, (err, rowCount, rows) => {
//           connection.release(); // Release the connection back to the pool
  
//           if (err) {
//             return reject(err);
//           }
//           resolve({ rowCount, rows });
//         });
  
//         connection.execSql(request);
//       });
//     });
//   };
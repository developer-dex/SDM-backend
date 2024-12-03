
import { ConnectionPool } from "mssql";

let pool: ConnectionPool;

// Database connection configuration
const config = {
  user: 'sa',        // Replace with your username
  password: 'ss123456', // Replace with your password
  server: '14.102.70.90',       // Replace with your server name
  database: 'SuperAdmin', // Replace with your database name
  port: 1440,
  options: {
    encrypt: true,               // Use SSL
    trustServerCertificate: true // For self-signed certificates
  }
};

export function databaseTestConnection(){
    pool = new ConnectionPool(config);
}

// export const dbConnection = new ConnectionPool(config);

// Function to execute multiple queries
export const testQuery = async (query: string) => {
//   pool = new ConnectionPool(config);

  try {
    await pool.connect(); // Connect to the database
    const result = await pool.query(query); // Execute the query
    return result.recordsets; // Return multiple recordsets if available
  } catch (error) {
    throw error; // Handle errors
  } finally {
    pool.close(); // Close the connection
  }
};
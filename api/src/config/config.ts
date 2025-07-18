import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// Default configuration
const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-key-for-development",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  
  // Database configuration
  databaseType: process.env.DATABASE_TYPE || "postgres",
  databaseHost: process.env.DATABASE_HOST || "localhost",
  databasePort: parseInt(process.env.DATABASE_PORT || "5432", 10),
  databaseName: process.env.DATABASE_NAME || "quentra",
  databaseUsername: process.env.DATABASE_USERNAME || "quentra",
  databasePassword: process.env.DATABASE_PASSWORD || "quentra_password",
  
  // For compatibility with existing code that might use these properties
  dbType: process.env.DATABASE_TYPE || "postgres",
  dbName: process.env.DATABASE_NAME || "quentra",
  
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4200",
};

export default config;

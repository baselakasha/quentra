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
  dbType: process.env.DB_TYPE || "sqlite",
  dbName: process.env.DB_NAME || "db.sqlite",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4200",
};

export default config;

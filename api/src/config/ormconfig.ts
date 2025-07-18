import { DataSource } from "typeorm";
import { User } from "@/auth/entity/user";
import { Budget } from "@/budget/entity/budget";
import { Category } from "@/budget/entity/category";
import * as path from "path";
import config from "./config";

const isTestEnvironment = config.nodeEnv === "testing";
console.log(`[Database Config] Environment: ${config.nodeEnv}, Using: ${isTestEnvironment ? "IN-MEMORY SQLite" : "PostgreSQL"}`);

// For test environment, use in-memory SQLite
// For other environments, use PostgreSQL with connection details from config
const dataSourceConfig = isTestEnvironment 
  ? {
      type: "sqlite" as const,
      database: ":memory:",
      entities: [User, Budget, Category],
      synchronize: true,
      logging: false,
    }
  : {
      type: config.databaseType as "postgres",
      host: config.databaseHost,
      port: config.databasePort,
      username: config.databaseUsername,
      password: config.databasePassword,
      database: config.databaseName,
      entities: [User, Budget, Category],
      synchronize: true, // Set to false in production and use migrations
      logging: config.nodeEnv === "development",
    };

export default new DataSource(dataSourceConfig);

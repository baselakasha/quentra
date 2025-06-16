import { DataSource } from "typeorm";
import { User } from "@/auth/entity/user";
import { Budget } from "@/budget/entity/budget";
import { Category } from "@/budget/entity/category";
import * as path from "path";

// Explicit check for testing environment
const isTestEnvironment = process.env.NODE_ENV === "testing";

// Log the database decision for debugging
console.log(`[Database Config] Environment: ${process.env.NODE_ENV}, Using: ${isTestEnvironment ? "IN-MEMORY DATABASE" : "FILE DATABASE"}`);

// For non-test environments, use absolute path to ensure consistency
const dbPath = isTestEnvironment 
  ? ":memory:" 
  : path.resolve(process.cwd(), "db.sqlite");

export default new DataSource({
  type: "sqlite",
  database: dbPath,
  entities: [User, Budget, Category],
  synchronize: true,
  logging: false,
});

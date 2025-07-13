import { DataSource } from "typeorm";
import { User } from "@/auth/entity/user";
import { Budget } from "@/budget/entity/budget";
import { Category } from "@/budget/entity/category";
import * as path from "path";
import config from "./config";

const isTestEnvironment = config.nodeEnv === "testing";
console.log(`[Database Config] Environment: ${config.nodeEnv}, Using: ${isTestEnvironment ? "IN-MEMORY DATABASE" : "FILE DATABASE"}`);

const dbPath = isTestEnvironment 
  ? ":memory:" 
  : path.resolve(process.cwd(), config.dbName);

export default new DataSource({
  type: config.dbType as "sqlite",
  database: dbPath,
  entities: [User, Budget, Category],
  synchronize: true,
  logging: false,
});

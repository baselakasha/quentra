import { DataSource } from "typeorm";
import { User } from "@/auth/entity/user";

export default new DataSource({
  type: "sqlite",
  database: process.env.NODE_ENV == "testing" ? ":memory:" : "db.sqlite",
  entities: [User],
  synchronize: true,
  logging: false,
});

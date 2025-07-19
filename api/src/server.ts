// Register module aliases first
import "./register-aliases";
import "reflect-metadata";
import AppDataSource from "./config/ormconfig";
import app from "./app";
import config from "./config/config";

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    app.on("error", (err) => {
      console.error("Server error:", err);
    });
    app.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

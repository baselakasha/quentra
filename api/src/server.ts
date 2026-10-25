// Register module aliases first
import "./register-aliases";
import "reflect-metadata";
import AppDataSource from "./config/ormconfig";
import app from "./app";
import config from "./config/config";

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    server.on("error", (err) => {
      console.error("Server error:", err);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

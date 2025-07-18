import express from "express";
import cors from "cors";
import authRouter from "./auth/route/auth";
import budgetRouter from "./budget/route/budget";
import categoryRouter from "./budget/route/category";
import config from "./config/config";

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/category", categoryRouter);

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Hello, World! Test");
});

export default app;

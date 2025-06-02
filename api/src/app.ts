import express from "express";
import authRouter from "./auth/route/auth";
const app = express();

app.use(express.json());
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello, World! Test");
});

export default app;

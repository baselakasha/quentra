import express from "express";
import cors from "cors";
import authRouter from "./auth/route/auth";

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello, World! Test");
});

export default app;

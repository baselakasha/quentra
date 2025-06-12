import express from "express";
import { register, login, getUserInfo } from "@/auth/controller/authController";
import { asyncHandler } from "@/util/asyncHandler";
import { authMiddleware } from "@/auth/middleware/authMiddleware";

const router = express.Router();

router.post("/signup", asyncHandler(register));
router.post("/signin", asyncHandler(login));

// Apply middleware separately to avoid type issues
router.get("/me", (req, res, next) => {
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    asyncHandler(getUserInfo)(req, res, next);
  });
});

export default router;
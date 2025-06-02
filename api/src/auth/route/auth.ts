import express from "express";
import { register, login } from "@/auth/controller/authController";
import { asyncHandler } from "@/util/asyncHandler";

const router = express.Router();

router.post("/signup", asyncHandler(register));
router.post("/signin", asyncHandler(login));

export default router;
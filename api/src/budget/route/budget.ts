import express from "express";

import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from "@/budget/controller/budgetController";
import { asyncHandler } from "@/util/asyncHandler";
import { authMiddleware } from "@/auth/middleware/authMiddleware";

const router = express.Router();
router.post("/", authMiddleware, asyncHandler(createBudget));
router.get("/", authMiddleware, asyncHandler(getBudgets));
router.get("/:id", authMiddleware, asyncHandler(getBudgetById));
router.put("/:id", authMiddleware, asyncHandler(updateBudget));
router.delete("/:id", authMiddleware, asyncHandler(deleteBudget));
export default router;
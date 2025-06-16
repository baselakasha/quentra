import express from 'express';

import {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '@/budget/controller/categoryController';
import { asyncHandler } from '@/util/asyncHandler';
import { authMiddleware } from '@/auth/middleware/authMiddleware';
const router = express.Router();

router.post('/', authMiddleware, asyncHandler(createCategory));
router.get('/:id', authMiddleware, asyncHandler(getCategoryById));
router.put('/:id', authMiddleware, asyncHandler(updateCategory));
router.delete('/:id', authMiddleware, asyncHandler(deleteCategory));
export default router;

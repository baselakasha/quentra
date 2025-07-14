import express from 'express';

import {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  updateCategoriesOrder
} from '@/budget/controller/categoryController';
import { asyncHandler } from '@/util/asyncHandler';
import { authMiddleware } from '@/auth/middleware/authMiddleware';
const router = express.Router();

router.post('/', authMiddleware, asyncHandler(createCategory));
router.put('/order', authMiddleware, asyncHandler(updateCategoriesOrder));
router.get('/:id', authMiddleware, asyncHandler(getCategoryById));
router.put('/:id', authMiddleware, asyncHandler(updateCategory));
router.delete('/:id', authMiddleware, asyncHandler(deleteCategory));

export default router;

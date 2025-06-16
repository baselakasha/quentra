import { NextFunction, Request, Response } from "express";

import { Category } from "../entity/category";
import AppDataSource from "@/config/ormconfig";
const categoryRepo = AppDataSource.getRepository(Category);

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, budgetId } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    const category = categoryRepo.create({
      name,
      budget: { id: budgetId, user: { id: userId } },
    });

    await categoryRepo.save(category);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};


export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const category = await categoryRepo.findOne({
      where: { id: categoryId, budget: { user: { id: userId } } },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    const category = await categoryRepo.findOne({
      where: { id: categoryId, budget: { user: { id: userId } } },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.name = name || category.name;

    await categoryRepo.save(category);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const category = await categoryRepo.findOne({
      where: { id: categoryId, budget: { user: { id: userId } } },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await categoryRepo.remove(category);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

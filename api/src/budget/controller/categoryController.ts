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
    const { name, budgetId, plannedAmount, spentAmount } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    // Find the highest order number to place the new category at the end
    const highestOrder = await categoryRepo
      .createQueryBuilder("category")
      .innerJoin("category.budget", "budget")
      .where("budget.id = :budgetId", { budgetId })
      .select("MAX(category.order)", "maxOrder")
      .getRawOne();

    const nextOrder = (highestOrder && highestOrder.maxOrder !== null) 
      ? highestOrder.maxOrder + 1 
      : 0;

    const category = categoryRepo.create({
      name,
      plannedAmount: plannedAmount || 0,
      spentAmount: spentAmount || 0,
      order: nextOrder,
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
    const { name, plannedAmount, spentAmount } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    const category = await categoryRepo.findOne({
      where: { id: categoryId, budget: { user: { id: userId } } },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update properties if they exist in the request
    if (name !== undefined) category.name = name;
    if (plannedAmount !== undefined) category.plannedAmount = plannedAmount;
    if (spentAmount !== undefined) category.spentAmount = spentAmount;

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

export const updateCategoriesOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: "Invalid categories data" });
    }

    // Validate that user has access to these categories
    const categoryIds = categories.map(cat => cat.id);
    const userCategories = await categoryRepo
      .createQueryBuilder("category")
      .innerJoin("category.budget", "budget")
      .innerJoin("budget.user", "user")
      .where("category.id IN (:...ids)", { ids: categoryIds })
      .andWhere("user.id = :userId", { userId })
      .getMany();

    if (userCategories.length !== categoryIds.length) {
      return res.status(403).json({ error: "Unauthorized access to one or more categories" });
    }

    // Update the order of each category
    const updatePromises = categories.map(cat => 
      categoryRepo.update(
        { id: cat.id },
        { order: cat.order }
      )
    );

    await Promise.all(updatePromises);
    
    res.status(200).json({ message: "Categories order updated successfully" });
  } catch (error) {
    next(error);
  }
};

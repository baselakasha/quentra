import { NextFunction, Request, Response } from "express";
import { Budget } from "../entity/budget";
import { Category } from "../entity/category";

import AppDataSource  from "@/config/ormconfig";

const budgetRepo  = AppDataSource.getRepository(Budget);
const categoryRepo = AppDataSource.getRepository(Category);

export const createBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
)=> {
  try {
    const { name, startDate, endDate, monthlyIncome } = req.body;
    const userId = (req as any).user.userId || (req as any).user.id;

    const budget = budgetRepo.create({
      name,
      startDate,
      endDate,
      monthlyIncome,
      user: { id: userId },
    });

    await budgetRepo.save(budget);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const { sort, direction } = req.query;
    
    console.log(`Sort request - field: ${sort}, direction: ${direction}`);
    
    // Build order object based on query parameters
    const order: Record<string, "ASC" | "DESC"> = {
      isPinned: "DESC" // Pinned budgets always come first
    };
    
    // Add secondary sort field if provided
    if (sort && ['name', 'startDate', 'endDate', 'monthlyIncome'].includes(sort as string)) {
      order[sort as string] = (direction === 'asc' ? 'ASC' : 'DESC');
    } else {
      // Default secondary sort is by start date, newest first
      order.startDate = "DESC";
    }
    
    const budgets = await budgetRepo.find({
      where: { user: { id: userId } },
      relations: ["categories"],
      order
    });
    
    // Order categories within each budget
    budgets.forEach(budget => {
      if (budget.categories) {
        budget.categories.sort((a, b) => a.order - b.order);
      }
    });

    res.status(200).json(budgets);
  } catch (error) {
    next(error);
  }
};

export const getBudgetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const budgetId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const budget = await budgetRepo.findOne({
      where: { id: budgetId, user: { id: userId } },
      relations: ["categories"],
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    // Order categories by their order field
    if (budget.categories) {
      budget.categories.sort((a, b) => a.order - b.order);
    }

    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const budgetId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const budget = await budgetRepo.findOne({
      where: { id: budgetId, user: { id: userId } },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const updatedBudget = budgetRepo.merge(budget, req.body);
    await budgetRepo.save(updatedBudget);

    res.status(200).json(updatedBudget);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const budgetId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const budget = await budgetRepo.findOne({
      where: { id: budgetId, user: { id: userId } },
      relations: ["categories"]
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Delete the budget with its categories in a transaction
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // If there are categories, delete them first
      if (budget.categories && budget.categories.length > 0) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(Category)
          .where("budgetId = :budgetId", { budgetId })
          .execute();
      }
      
      // Then delete the budget
      await transactionalEntityManager.remove(budget);
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const pinBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const budgetId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    // Begin a transaction to ensure data consistency
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // First, unpin all budgets for this user
      await transactionalEntityManager
        .createQueryBuilder()
        .update(Budget)
        .set({ isPinned: false })
        .where("user.id = :userId", { userId })
        .execute();
      
      // Then pin the selected budget
      const budget = await transactionalEntityManager.findOne(Budget, {
        where: { id: budgetId, user: { id: userId } },
      });
      
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      budget.isPinned = true;
      await transactionalEntityManager.save(budget);
    });
    
    // Get the updated budget to return
    const updatedBudget = await budgetRepo.findOne({
      where: { id: budgetId, user: { id: userId } },
      relations: ["categories"],
    });
    
    if (!updatedBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    res.status(200).json(updatedBudget);
  } catch (error) {
    next(error);
  }
};

export const unpinBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const budgetId = req.params.id;
    const userId = (req as any).user.userId || (req as any).user.id;

    const budget = await budgetRepo.findOne({
      where: { id: budgetId, user: { id: userId } },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    budget.isPinned = false;
    await budgetRepo.save(budget);

    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
};

export const duplicateBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId || (req as any).user.id;
    
    // Find the budget to duplicate
    const sourceBudget = await budgetRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ["categories"]
    });
    
    if (!sourceBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    // Create a new budget with data from the source budget
    const newBudget = budgetRepo.create({
      name: `${sourceBudget.name} (Copy)`,
      startDate: sourceBudget.startDate,
      endDate: sourceBudget.endDate,
      monthlyIncome: sourceBudget.monthlyIncome,
      isPinned: false, // Never duplicate as pinned
      user: { id: userId }
    });
    
    // Save the new budget
    const savedBudget = await budgetRepo.save(newBudget);
    
    // Duplicate all categories if they exist
    if (sourceBudget.categories && sourceBudget.categories.length > 0) {
      const newCategories = sourceBudget.categories.map(category => {
        return categoryRepo.create({
          name: category.name,
          plannedAmount: category.plannedAmount,
          spentAmount: 0, // Reset spent amount to 0 for the new budget
          budget: { id: savedBudget.id },
          order: category.order
        });
      });
      
      await categoryRepo.save(newCategories);
      
      // Attach categories to the response
      savedBudget.categories = await categoryRepo.find({
        where: { budget: { id: savedBudget.id } }
      });
    }
    
    res.status(201).json(savedBudget);
  } catch (error) {
    next(error);
  }
};




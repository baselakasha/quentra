import { NextFunction, Request, Response } from "express";
import { Budget } from "../entity/budget";

import AppDataSource  from "@/config/ormconfig";

const budgetRepo  = AppDataSource.getRepository(Budget);

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
    const budgets = await budgetRepo.find({
      where: { user: { id: userId } },
      relations: ["categories"],
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
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    await budgetRepo.remove(budget);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};




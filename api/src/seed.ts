import "reflect-metadata";
import AppDataSource from "@/config/ormconfig";
import { User } from "@/auth/entity/user";
import { Budget } from "@/budget/entity/budget";
import { Category } from "@/budget/entity/category";
import bcrypt from "bcrypt";

const DEMO_USER = {
  username: "alexm",
  password: "demo1234",
  fullName: "Alex Morgan",
};

interface SeedCategory {
  name: string;
  plannedAmount: number;
  spentAmount: number;
  type: "need" | "want";
}

interface SeedBudget {
  name: string;
  startDate: string;
  endDate: string;
  monthlyIncome: number;
  isPinned: boolean;
  categories: SeedCategory[];
}

const budgets: SeedBudget[] = [
  {
    name: "February 2026",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    monthlyIncome: 5800,
    isPinned: true,
    categories: [
      { name: "Rent", plannedAmount: 1500, spentAmount: 1500, type: "need" },
      { name: "Groceries", plannedAmount: 400, spentAmount: 370, type: "need" },
      { name: "Utilities", plannedAmount: 150, spentAmount: 132, type: "need" },
      { name: "Transport", plannedAmount: 200, spentAmount: 185, type: "need" },
      { name: "Health & Insurance", plannedAmount: 250, spentAmount: 250, type: "need" },
      { name: "Dining Out", plannedAmount: 200, spentAmount: 240, type: "want" },
      { name: "Subscriptions", plannedAmount: 80, spentAmount: 80, type: "want" },
      { name: "Entertainment", plannedAmount: 150, spentAmount: 95, type: "want" },
      { name: "Clothing", plannedAmount: 100, spentAmount: 0, type: "want" },
      { name: "Savings", plannedAmount: 700, spentAmount: 700, type: "need" },
    ],
  },
  {
    name: "January 2026",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    monthlyIncome: 5800,
    isPinned: false,
    categories: [
      { name: "Rent", plannedAmount: 1500, spentAmount: 1500, type: "need" },
      { name: "Groceries", plannedAmount: 400, spentAmount: 415, type: "need" },
      { name: "Utilities", plannedAmount: 150, spentAmount: 162, type: "need" },
      { name: "Transport", plannedAmount: 200, spentAmount: 178, type: "need" },
      { name: "Health & Insurance", plannedAmount: 250, spentAmount: 250, type: "need" },
      { name: "Dining Out", plannedAmount: 200, spentAmount: 185, type: "want" },
      { name: "Subscriptions", plannedAmount: 80, spentAmount: 80, type: "want" },
      { name: "Entertainment", plannedAmount: 150, spentAmount: 210, type: "want" },
      { name: "Clothing", plannedAmount: 100, spentAmount: 320, type: "want" },
      { name: "Savings", plannedAmount: 700, spentAmount: 700, type: "need" },
    ],
  },
  {
    name: "December 2025",
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    monthlyIncome: 5800,
    isPinned: false,
    categories: [
      { name: "Rent", plannedAmount: 1500, spentAmount: 1500, type: "need" },
      { name: "Groceries", plannedAmount: 400, spentAmount: 480, type: "need" },
      { name: "Utilities", plannedAmount: 150, spentAmount: 198, type: "need" },
      { name: "Transport", plannedAmount: 200, spentAmount: 155, type: "need" },
      { name: "Health & Insurance", plannedAmount: 250, spentAmount: 250, type: "need" },
      { name: "Gifts", plannedAmount: 400, spentAmount: 520, type: "want" },
      { name: "Dining Out", plannedAmount: 250, spentAmount: 310, type: "want" },
      { name: "Subscriptions", plannedAmount: 80, spentAmount: 80, type: "want" },
      { name: "Entertainment", plannedAmount: 300, spentAmount: 275, type: "want" },
      { name: "Savings", plannedAmount: 500, spentAmount: 500, type: "need" },
    ],
  },
  {
    name: "Summer Vacation",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    monthlyIncome: 3000,
    isPinned: false,
    categories: [
      { name: "Flights", plannedAmount: 800, spentAmount: 0, type: "need" },
      { name: "Accommodation", plannedAmount: 900, spentAmount: 0, type: "need" },
      { name: "Food & Dining", plannedAmount: 500, spentAmount: 0, type: "need" },
      { name: "Activities", plannedAmount: 400, spentAmount: 0, type: "want" },
      { name: "Shopping", plannedAmount: 200, spentAmount: 0, type: "want" },
      { name: "Transport", plannedAmount: 150, spentAmount: 0, type: "need" },
      { name: "Travel Insurance", plannedAmount: 100, spentAmount: 0, type: "need" },
    ],
  },
  {
    name: "Emergency Fund",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    monthlyIncome: 1000,
    isPinned: false,
    categories: [
      { name: "Monthly Contribution", plannedAmount: 500, spentAmount: 200, type: "need" },
      { name: "Car Repairs Reserve", plannedAmount: 200, spentAmount: 0, type: "need" },
      { name: "Medical Reserve", plannedAmount: 200, spentAmount: 0, type: "need" },
      { name: "Home Repairs Reserve", plannedAmount: 100, spentAmount: 0, type: "need" },
    ],
  },
];

async function seed() {
  await AppDataSource.initialize();
  console.log("Connected to database.");

  const userRepo = AppDataSource.getRepository(User);
  const budgetRepo = AppDataSource.getRepository(Budget);
  const categoryRepo = AppDataSource.getRepository(Category);

  // Create or find demo user
  let user = await userRepo.findOne({ where: { username: DEMO_USER.username } });
  if (!user) {
    const hashed = await bcrypt.hash(DEMO_USER.password, 10);
    user = userRepo.create({ ...DEMO_USER, password: hashed });
    await userRepo.save(user);
    console.log(`Created demo user: ${DEMO_USER.username} / ${DEMO_USER.password}`);
  } else {
    console.log(`Demo user already exists: ${DEMO_USER.username}`);
  }

  for (const [i, budgetData] of budgets.entries()) {
    const existing = await budgetRepo.findOne({
      where: { name: budgetData.name, user: { id: user.id } },
    });
    if (existing) {
      console.log(`  Skipping "${budgetData.name}" (already exists)`);
      continue;
    }

    const budget = budgetRepo.create({
      name: budgetData.name,
      startDate: new Date(budgetData.startDate),
      endDate: new Date(budgetData.endDate),
      monthlyIncome: budgetData.monthlyIncome,
      isPinned: budgetData.isPinned,
      user: { id: user.id },
    });
    await budgetRepo.save(budget);

    const categories = budgetData.categories.map((cat, order) =>
      categoryRepo.create({
        name: cat.name,
        plannedAmount: cat.plannedAmount,
        spentAmount: cat.spentAmount,
        type: cat.type,
        order,
        budget: { id: budget.id },
      })
    );
    await categoryRepo.save(categories);
    console.log(`  Created budget "${budget.name}" with ${categories.length} categories`);
  }

  await AppDataSource.destroy();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

import "../../tests/env-setup";
import "reflect-metadata";
import AppDataSource from "@/config/ormconfig";

import request from "supertest";
import {
  describe,
  expect,
  it,
  beforeAll,
} from "@jest/globals";
import app from "@/app";

// Add error handling middleware for tests
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Test error:", err.stack);
  res.status(500).json({ error: err.message });
});

describe("Budget Management", () => {
  let token: string = "";
  beforeAll(async () => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log("Database connection initialized for tests");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }

    // Create a test user using api
    const userResponse = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      fullName: "Test User",
      password: "password123",
    });

    token = userResponse.body.token;
  });

  it("should create a budget", async () => {
    const response = await request(app)
      .post("/api/budget")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Budget",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        monthlyIncome: 5000,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Budget");
  });

  it("should get all budgets", async () => {
    const response = await request(app)
      .get("/api/budget")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should get a budget by ID", async () => {
    const createResponse = await request(app)
      .post("/api/budget")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Another Budget",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        monthlyIncome: 3000,
      });

    const budgetId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/budget/${budgetId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", budgetId);
    expect(response.body.name).toBe("Another Budget");
  });

  it("should update a budget", async () => {
    const createResponse = await request(app)
      .post("/api/budget")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Budget to Update",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        monthlyIncome: 4000,
      });

    const budgetId = createResponse.body.id;

    const response = await request(app)
      .put(`/api/budget/${budgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Budget",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        monthlyIncome: 6000,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", budgetId);
    expect(response.body.name).toBe("Updated Budget");
  });

    it("should delete a budget", async () => {
        const createResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Budget to Delete",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
            monthlyIncome: 2000,
        });

        const budgetId = createResponse.body.id;

        const response = await request(app)
        .delete(`/api/budget/${budgetId}`)
        .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(204);

        // Verify the budget is deleted
        const getResponse = await request(app)
        .get(`/api/budget/${budgetId}`)
        .set("Authorization", `Bearer ${token}`);

        expect(getResponse.statusCode).toBe(404);
    });

  describe("Budget duplication", () => {
    it("should duplicate a budget", async () => {
      const createResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Budget to Duplicate",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          monthlyIncome: 5000,
        });

      const budgetId = createResponse.body.id;

      // Add a category to the source budget
      await request(app)
        .post("/api/category")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Rent",
          plannedAmount: 1000,
          spentAmount: 500,
          type: "need",
          budgetId,
        });

      const duplicateResponse = await request(app)
        .post(`/api/budget/${budgetId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(duplicateResponse.statusCode).toBe(201);
      expect(duplicateResponse.body.name).toBe("Budget to Duplicate (Copy)");
      expect(duplicateResponse.body.categories.length).toBe(1);
    });

    it("should preserve category types when duplicating", async () => {
      const createResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Type Preservation Budget",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          monthlyIncome: 5000,
        });

      const budgetId = createResponse.body.id;

      await request(app)
        .post("/api/category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Groceries", plannedAmount: 400, spentAmount: 0, type: "need", budgetId });

      await request(app)
        .post("/api/category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Netflix", plannedAmount: 15, spentAmount: 0, type: "want", budgetId });

      const duplicateResponse = await request(app)
        .post(`/api/budget/${budgetId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(duplicateResponse.statusCode).toBe(201);

      const sourceResponse = await request(app)
        .get(`/api/budget/${budgetId}`)
        .set("Authorization", `Bearer ${token}`);

      const sourceCategories: { name: string; type: string }[] = sourceResponse.body.categories;
      const dupCategories: { name: string; type: string }[] = duplicateResponse.body.categories;

      for (const sourceCategory of sourceCategories) {
        const dupCategory = dupCategories.find(c => c.name === sourceCategory.name);
        expect(dupCategory).toBeDefined();
        expect(dupCategory!.type).toBe(sourceCategory.type);
      }
    });

    it("should reset spentAmount to 0 on all duplicated categories", async () => {
      const createResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Spent Reset Budget",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          monthlyIncome: 5000,
        });

      const budgetId = createResponse.body.id;

      await request(app)
        .post("/api/category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Utilities", plannedAmount: 200, spentAmount: 150, type: "need", budgetId });

      await request(app)
        .post("/api/category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Dining Out", plannedAmount: 300, spentAmount: 250, type: "want", budgetId });

      const duplicateResponse = await request(app)
        .post(`/api/budget/${budgetId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(duplicateResponse.statusCode).toBe(201);

      const dupCategories: { spentAmount: number }[] = duplicateResponse.body.categories;
      for (const category of dupCategories) {
        expect(category.spentAmount).toBe(0);
      }
    });

    it("should return 404 when duplicating a non-existent budget", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post(`/api/budget/${fakeId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
    });
  });
});

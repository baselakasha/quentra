import "../../tests/env-setup";
import "reflect-metadata";
import AppDataSource from "@/config/ormconfig";

import request from "supertest";
import { describe, expect, it, beforeAll } from "@jest/globals";
import app from "@/app";

// Add error handling middleware for tests
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Test error:", err.stack);
  res.status(500).json({ error: err.message });
});

describe("Budget Category Management", () => {
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

  it("should create a budget category", async () => {
    const budgetResponse = await request(app)
      .post("/api/budget")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Budget",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
      });
    expect(budgetResponse.statusCode).toBe(201);

    const budgetId = budgetResponse.body.id;
    expect(budgetResponse.statusCode).toBe(201);
    expect(budgetResponse.body).toHaveProperty("id");
    expect(budgetResponse.body.name).toBe("Test Budget");

    const response = await request(app)
      .post(`/api/category`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Category",
        budgetId: budgetId,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Category");
  });

    it("should get all categories for a budget", async () => {
        const budgetResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Budget 2",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
        });
        expect(budgetResponse.statusCode).toBe(201);
    
        const budgetId = budgetResponse.body.id;
    
        // Create a category for the new budget
        await request(app)
        .post(`/api/category`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Category 2",
            budgetId: budgetId,
        });
    
        const response = await request(app)
        .get(`/api/budget/${budgetId}`)
        .set("Authorization", `Bearer ${token}`);
    
        expect(response.statusCode).toBe(200);
        expect(response.body.categories).toBeInstanceOf(Array);
        const categories = response.body.categories;
        expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it("should get a category by ID", async () => {
        const budgetResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Budget 3",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
        });
        expect(budgetResponse.statusCode).toBe(201);

        const budgetId = budgetResponse.body.id;

        // Create a category for the new budget
        const categoryResponse = await request(app)
        .post(`/api/category`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Category 3",
            budgetId: budgetId,
        });

        expect(categoryResponse.statusCode).toBe(201);
        expect(categoryResponse.body).toHaveProperty("id");

        const categoryId = categoryResponse.body.id;

        const response = await request(app)
        .get(`/api/category/${categoryId}`)
        .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", categoryId);
    });

    it("should update a category", async () => {
        const budgetResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Budget 4",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
        });
        expect(budgetResponse.statusCode).toBe(201);

        const budgetId = budgetResponse.body.id;

        // Create a category for the new budget
        const categoryResponse = await request(app)
        .post(`/api/category`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Category 4",
            budgetId: budgetId,
        });

        expect(categoryResponse.statusCode).toBe(201);
        expect(categoryResponse.body).toHaveProperty("id");

        const categoryId = categoryResponse.body.id;

        const response = await request(app)
        .put(`/api/category/${categoryId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Updated Category Name",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", categoryId);
        expect(response.body.name).toBe("Updated Category Name");
    });

    it("should delete a category", async () => {
        const budgetResponse = await request(app)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Budget 5",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
        });
        expect(budgetResponse.statusCode).toBe(201);

        const budgetId = budgetResponse.body.id;

        // Create a category for the new budget
        const categoryResponse = await request(app)
        .post(`/api/category`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Category 5",
            budgetId: budgetId,
        });

        expect(categoryResponse.statusCode).toBe(201);
        expect(categoryResponse.body).toHaveProperty("id");

        const categoryId = categoryResponse.body.id;

        const response = await request(app)
        .delete(`/api/category/${categoryId}`)
        .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(204);
    });


    it("should return 404 for non-existent category", async () => {
        const response = await request(app)
        .get(`/api/category/999999`)
        .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Category not found");
    });
});

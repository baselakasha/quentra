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
});

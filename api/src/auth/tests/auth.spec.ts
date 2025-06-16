import "../../tests/env-setup";
import "reflect-metadata";
import AppDataSource from "@/config/ormconfig";

import request from "supertest";
import { describe, expect, it, beforeAll, afterAll, afterEach } from "@jest/globals";
import app from "@/app";
import { User } from "@/auth/entity/user";

// Add error handling middleware for tests
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Test error:", err.stack);
  res.status(500).json({ error: err.message });
});

describe("Authentication", () => {
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
  });

  afterEach(async () => {
    await AppDataSource.getRepository(User).clear();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed");
    }
  });

  it("should register a new user", async () => {
    try {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({ username: "testuser", fullName: "Test User", password: "password123" });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("token");
    } catch (error) {
      console.error("Test error:", error);
      throw error;
    }
  });

  it("should not register a user with a duplicate username", async () => {
    await request(app)
      .post("/api/auth/signup")
        .send({ username: "testuser", fullName: "Test User", password: "password123" });

    const response = await request(app)
      .post("/api/auth/signup")
        .send({ username: "testuser", fullName: "Test User", password: "password123" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("User already exists");
  });

  it("should allow a registered user to sign in", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ username: "loginuser", fullName: "Test User", password: "password123" });

    const response = await request(app)
      .post("/api/auth/signin")
      .send({ username: "loginuser", password: "password123" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not allow login with incorrect password", async () => {
    await request(app)
      .post("/api/auth/signup")
        .send({ username: "secureuser", fullName: "Test User", password: "password123" });

    const response = await request(app)
      .post("/api/auth/signin")
      .send({ username: "secureuser", password: "wrongpassword" });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should return 404 for non-existent user login attempt", async () => {
    const response = await request(app)
      .post("/api/auth/signin")
      .send({ username: "nonexistentuser", password: "anypassword" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("User not found");
  });
});

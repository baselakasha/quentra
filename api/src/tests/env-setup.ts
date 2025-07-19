// Force the test environment
process.env.NODE_ENV = "testing";
process.env.JWT_SECRET = "test-secret-key";

// Ensure we're using SQLite in-memory database for testing
process.env.DATABASE_TYPE = "sqlite";

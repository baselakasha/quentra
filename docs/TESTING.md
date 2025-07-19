# Running Tests in Docker

This document explains how to run the backend tests in Docker containers, both locally and in the GitHub Actions CI pipeline.

## Running Tests Locally

To run the tests locally in a Docker container:

```bash
# Run the test suite in Docker
./compose.sh test run
```

This command will:
1. Build the test container using `Dockerfile.test`
2. Run the test suite in the container with in-memory SQLite database
3. Return the exit code from the test container
4. Stop and remove all containers when done

## GitHub Actions Integration

The project is configured to run tests automatically in GitHub Actions whenever:
- Code is pushed to the `main` branch
- A pull request targeting the `main` branch is created or updated
- Changes are made to the API code, workflow configuration, or Docker test setup

The workflow configuration is located at `.github/workflows/api-tests.yml`.

## Test Environment

The test environment uses:
- In-memory SQLite database for fast, isolated testing
- Docker containers with Linux/AMD64 platform (for GitHub Actions compatibility)
- Configured environment variables for testing

## Troubleshooting

If you encounter issues with the test environment:

1. Check the Docker logs:
   ```bash
   ./compose.sh test logs
   ```

2. Inspect the test containers:
   ```bash
   ./compose.sh test ps
   ```

3. Access the test container shell:
   ```bash
   docker exec -it quentra-api-test sh
   ```

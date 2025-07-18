# Quentra - Dockerized

This document provides instructions for setting up and running the Quentra application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Docker configured for ARM architecture support

## Quick Start - Development Environment

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the development environment:
   ```bash
   docker-compose up -d
   ```
4. Access the application:
   - Frontend: http://localhost:4200
   - API: http://localhost:3000

## Production Deployment

1. Set up your production environment variables:
   ```bash
   cp .env.example .env.prod
   ```
2. Edit the `.env.prod` file with your production values (secure passwords, secrets, etc.)
3. Start the production environment:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```
4. Access the application:
   - Frontend: http://your-server-ip (default port 80)

## Environment Variables

### Required Environment Variables

- `POSTGRES_USER`: PostgreSQL database username
- `POSTGRES_PASSWORD`: PostgreSQL database password
- `POSTGRES_DB`: PostgreSQL database name
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRES_IN`: JWT token expiration time (e.g., "7d" for 7 days)

### Optional Environment Variables

- `FRONTEND_PORT`: Port for the frontend service (default: 80 in production, 4200 in development)
- `API_PORT`: Port for the API service (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Container Management

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
# All containers
docker-compose logs

# Specific container
docker-compose logs api
docker-compose logs frontend
docker-compose logs postgres
```

### Rebuild containers after changes
```bash
docker-compose up -d --build
```

### Stop containers
```bash
docker-compose down
```

### Stop containers and remove volumes
```bash
docker-compose down -v
```

## Database Management

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U quentra -d quentra
```

### Create a database backup
```bash
docker-compose exec postgres pg_dump -U quentra -d quentra > backup.sql
```

### Restore from a backup
```bash
cat backup.sql | docker-compose exec -T postgres psql -U quentra -d quentra
```

## Troubleshooting

- **Database Connection Issues**: Check if the PostgreSQL container is running and healthy
  ```bash
  docker-compose ps
  ```

- **Frontend Cannot Connect to API**: Verify the environment settings in the frontend application

- **Container Startup Failures**: Check the logs for specific errors
  ```bash
  docker-compose logs
  ```

## Development with Docker

- Backend code changes will automatically reload due to volume mounting
- Frontend code changes will automatically reload due to volume mounting
- Database data is persisted in a Docker volume

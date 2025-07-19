
<div align="center">
  
<img width="92" height="90" alt="logo" src="https://github.com/user-attachments/assets/1775d395-56c5-4711-9d86-db34451303c7" />

<h1>Quentra - Budget Management Web Application</h1>

![](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![](https://img.shields.io/badge/typeorm-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)
![](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

<img src="https://github.com/user-attachments/assets/d44e4f9f-9ae7-45d0-9a5e-5e0117433520" width="80%" />

Manage your monthly household budget, a holiday, a project or any budget using an intuitive web app.

</div>

## Implementation
The backend is a RESTful API built using TypeScript, Node.js, Express.js, and TypeOrm, while the frontend is built using Angular 

Testing was done using Jest. 

Continuous Integration (CI) is done using GitHub Actions.

## Docker Deployment

Quentra can be deployed using Docker and Docker Compose in both development and production environments.

### Prerequisites
- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Quick Start

We provide a convenient script to manage development and production environments:

```bash
# Start development environment
./compose.sh dev up -d

# Start production environment
./compose.sh prod up -d

# Run tests in Docker
./compose.sh test run

# Stop development environment
./compose.sh dev down

# Stop production environment
./compose.sh prod down

# View logs for development
./compose.sh dev logs -f

# View logs for production
./compose.sh prod logs -f

# Build development images
./compose.sh dev build

# Build production images
./compose.sh prod build
```

### Development Environment

The development environment:
- Uses hot-reloading for both frontend and backend
- Mounts local directories as volumes for real-time code changes
- Exposes ports for direct access:
  - Frontend: http://localhost:4200
  - API: http://localhost:3000
  - PostgreSQL: localhost:5432

### Production Environment

The production environment:
- Uses optimized production builds
- Has proper Nginx configuration for the frontend
- Routes API requests through Nginx
- Only exposes port 80 to access the application
- Available at: http://localhost

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```properties
# Database Configuration
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=quentra

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

For development, default values are provided if these variables are not set. 

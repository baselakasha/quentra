
<div align="center">
  
<img width="92" height="90" alt="logo" src="https://github.com/user-attachments/assets/1775d395-56c5-4711-9d86-db34451303c7" />

<h1>Quentra - Budget Management Web Application</h1>

![](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![Chart.js](https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white) 
![](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![](https://img.shields.io/badge/typeorm-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)
![](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

<img src="https://github.com/user-attachments/assets/d44e4f9f-9ae7-45d0-9a5e-5e0117433520" width="80%" />

Manage your monthly household budget, a holiday, a project or any budget using an intuitive web app.

</div>

## Features 

Full list of user stories [here](./docs/user-stories.md).

- Create as many budgets as you want (household, holiday, project, whatever) and pin the ones you use most
- Duplicate a budget instead of setting one up from scratch every time
- Group spending into your own categories, rename them inline, reorder by drag and drop
- Progress bars and color coding so you can tell at a glance if you're over/under plan
- Set a monthly income and it'll work out your savings for you
- Works fine on mobile, not just desktop

## Implementation
Backend is a TypeScript/Express REST API with TypeORM + PostgreSQL. Frontend is Angular.

Tests are written with Jest, and GitHub Actions runs them on every push.

## Docker Deployment

Quentra can be deployed using Docker and Docker Compose in both development and production environments.

### Prerequisites
- Docker and Docker Compose are installed on your system
- Git for cloning the repository

### Quick Start

We provide a convenient script to manage development and production environments:

```bash
# Start 
./compose.sh [dev|prod] up -d

# Run tests
./compose.sh test run

# View logs 
./compose.sh [dev|prod] logs -f
```


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

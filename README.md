
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

View list of user stories: [User Stories](./docs/user_stories.md)

### Flexible Budget Management
- **Multiple Budget Types**: Create specialized budgets for household expenses, vacations, projects, or any financial goal
- **Budget Duplication**: Save time by cloning existing budgets as templates for new ones
- **Priority Pinning**: Keep important budgets easily accessible at the top of your dashboard
- **Custom Categories**: Organize spending with personalized categories that match your lifestyle

### Visual Financial Insights
- **Real-time Progress Tracking**: Visual indicators show exactly how your spending compares to your plan
- **Color-coded Budget Health**: Instantly understand your financial status with intuitive color cues
- **Savings Projections**: Automatically calculate and visualize potential savings when income is set
- **Timeline Awareness**: Clear indicators of budget duration help you stay on track

### Intuitive User Experience
- **Drag-and-Drop Organization**: Reorder categories effortlessly on desktop
- **In-line Editing**: Quickly rename categories with a simple click
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Clean, Modern Interface**: Thoughtfully designed with focus on simplicity and efficiency

## Implementation
The backend is a RESTful API built using TypeScript, Node.js, Express.js, and TypeOrm with PostgreSQL database, while the frontend is built using Angular 

Testing was done using Jest. 

Continuous Integration (CI) is done using GitHub Actions.

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

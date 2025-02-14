[![Banner](https://github.com/user-attachments/assets/84169d26-84f0-4786-bf37-87484ef475bb)](https://gitmarks.org)

## GitMarks Overview

GitMarks is a Git-based grading platform that streamlines the academic assessment process by leveraging industry-standard workflows. It provides a comprehensive solution for both educational staff and students, combining automated grading capabilities with professional development practices.

## Technology Stack

### Core Technologies
[![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/doc/)
[![Go Fiber](https://img.shields.io/badge/go--fiber-0096C2?style=for-the-badge&logo=go&logoColor=white)](https://gofiber.io/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://camo.githubusercontent.com/3467eb8e0dc6bdaa8fa6e979185d371ab39c105ec7bd6a01048806b74378d24c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f52656163742d3230323332413f7374796c653d666f722d7468652d6261646765266c6f676f3d7265616374266c6f676f436f6c6f723d363144414642)](https://react.dev/)
[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com)
[![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)](https://tanstack.com/query/v5)
[![Chart JS](https://img.shields.io/badge/Chart%20js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

### Infrastructure
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Amazon S3](https://img.shields.io/badge/Amazon%20S3-2ca02c?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![ECS](https://img.shields.io/badge/Amazon%20ECS-FF9900?style=for-the-badge&logo=amazonecs&logoColor=white)](https://aws.amazon.com/ecs/)
[![RDS](https://img.shields.io/badge/Amazon%20RDS-1f77b4?style=for-the-badge&logo=amazonrds&logoColor=white)](https://aws.amazon.com/rds/)

## Features

<div align="left">

| Category | Capabilities |
|:---------|:-------------|
| **GitHub Integration** | • Seamless repository management<br>• Native pull request workflow<br>• Automated assignment distribution |
| **Automated Assessment** | • GitHub Actions integration<br>• Customizable test suites<br>• Immediate feedback loops |
| **Code Review System** | • Line-by-line annotations<br>• Inline feedback tools<br>• Review history tracking |
| **Assignment Management** | • Template-based distribution<br>• Deadline management<br>• Bulk operations support |
| **Progress Analytics** | • Real-time submission tracking<br>• Performance metrics<br>• Completion statistics |

</div>

## Team

<div align="left">

<table>
  <tr>
    <td align="center" width="33%">
      <a href="https://github.com/ntietje1">
        <img src="/frontend/public/images/nick-tietje.jpg" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Nick Tietje</strong><br>
      </a>
      Full Stack Developer
    </td>
    <td align="center" width="33%">
      <a href="https://github.com/CamPlume1">
        <img src="/frontend/public/images/cameron-plume.jpg" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Cam Plume</strong><br>
      </a>
      Backend Developer
    </td>
    <td align="center" width="33%">
      <a href="https://github.com/kennybc">
        <img src="/frontend/public/images/kenneth-chen.png" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Kenny Chen</strong><br>
      </a>
      Full Stack Developer
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <a href="https://github.com/nandini-ghosh">
        <img src="/frontend/public/images/nandini-ghosh.png" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Nandini Ghosh</strong><br>
      </a>
      Designer & Frontend Developer
    </td>
    <td align="center" width="33%">
      <a href="https://github.com/alexangione419">
        <img src="/frontend/public/images/alexander-angione.jpg" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Alex Angione</strong><br>
      </a>
      Full Stack Developer
    </td>
    <td align="center" width="33%">
      <a href="https://github.com/sebytremblay">
        <img src="/frontend/public/images/sebastian-tremblay.png" width="150" height="150" style="border-radius: 50%"><br>
        <strong>Seby Tremblay</strong><br>
      </a>
      Infrastructure & Product Manager
    </td>
  </tr>
</table>

</div>

## Getting Started

### Prerequisites

The following tools are required to run GitMarks:

- [Go](https://go.dev/doc/install) - Backend runtime
- [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) - Frontend development
- [Docker](https://www.docker.com/get-started/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) - Database containerization
- [Ngrok](https://ngrok.com/docs/getting-started/) - Local development tunneling

### Configuration

1. Backend Configuration (`/backend/.env`):
```env
APP_PRIVATE_KEY=<GitHub App Private Key>
APP_ID=<GitHub App ID>
APP_INSTALLATION_ID=<GitHub App Installation ID>
APP_WEBHOOK_SECRET=<GitHub App Webhook Secret>
APP_NAME=<GitHub App Name>
CLIENT_REDIRECT_URL=<OAuth Redirect URL>
CLIENT_ID=<GitHub OAuth App Client ID>
CLIENT_SECRET=<GitHub OAuth App Client Secret>
CLIENT_URL=<OAuth Authorization Endpoint>
CLIENT_TOKEN_URL=<OAuth Token Endpoint>
CLIENT_JWT_SECRET=<JWT Secret Key>
DATABASE_URL=<Database Connection String>
```

2. Frontend Configuration (`/frontend/.env`):
```env
VITE_PUBLIC_API_DOMAIN=<Backend URL>
VITE_PUBLIC_FRONTEND_DOMAIN=<Frontend URL>
VITE_GITHUB_CLIENT_ID=<GitHub OAuth App Client ID>
VITE_GITHUB_APP_NAME=<GitHub App Name>
```

### Development Setup

#### Using Make (Recommended)
```bash
# 1. Start the database
make db-run

# 2. Launch the backend
make backend-dep
make backend-run

# 3. Start ngrok tunnel
make ngrok-run

# 4. Launch the frontend
make frontend-run
```

#### Manual Setup
```bash
# 1. Start Docker services
docker compose up --build

# 2. Start ngrok tunnel
ngrok http --domain={your-ngrok-domain} 8080

# 3. Install frontend dependencies
cd frontend
npm install

# 4. Start frontend development server
npm run dev
```

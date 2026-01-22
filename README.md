# Setup Guide

This guide explains how to set up the Undergraduate Transfer Management System (UTMS) locally.

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

## Project Structure

```
webapp/
├── client/    # Angular 20 frontend
├── server/    # NestJS 11 backend
└── theme/     # UI theme (optional)
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd undergraduate-transfer-management/webapp
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (or use the existing one):

```env
NODE_ENV=development
PORT=5001
DATABASE_PATH=./data/utms.db
JWT_SECRET=utms-secret-key-change-in-production
JWT_EXPIRATION=30m
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

Seed the database with initial data:

```bash
npm run seed
```

Start the backend server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:5001`.

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm start
```

The application will be available at `http://localhost:4200`.

## Quick Start (Both Services)

**Terminal 1 - Backend:**
```bash
cd server && npm install && npm run seed && npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd client && npm install && npm start
```

## Available Scripts

### Server

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot-reload |
| `npm run start:prod` | Start production server |
| `npm run seed` | Seed database with mock data |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

### Client

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |

## Default Ports

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5001

## Troubleshooting

**Port already in use:**
Change the port in `server/.env` or use a different port for Angular:
```bash
ng serve --port 4300
```

**Database issues:**
Delete `server/data/utms.db` and run `npm run seed` again.

**Node version issues:**
Use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

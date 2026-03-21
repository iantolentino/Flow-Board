# MyBoard Enterprise Productivity Suite

## Overview

MyBoard is an enterprise-grade productivity platform that integrates Kanban task management, calendar scheduling, secure password vault, and budget tracking into a unified, secure application. Built with modern security practices and DevOps principles, it provides a complete solution for personal and team productivity with data isolation, encryption, and scalable architecture.

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Architecture

The application follows a three-tier architecture with clear separation of concerns:

```
┌────────────────────────────────────────────────────────────┐
│                     Client Browser                         │
│  ┌──────────┬──────────┬──────────┬────────────────────┐   │
│  │ Kanban   │ Calendar │  Vault   │    Budget          │   │
│  └──────────┴──────────┴──────────┴────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Authentication | Rate Limiting | Validation | Logs  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                   Application Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Controllers  │  Services  │  Models  │  Utils       │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PostgreSQL (Primary)  │  Redis (Cache/Rate Limit)   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.18+ | Web framework |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching and rate limiting |

### Security & Authentication
| Technology | Purpose |
|------------|---------|
| JWT (JSON Web Tokens) | Stateless authentication |
| bcrypt | Password hashing (12 rounds) |
| AES-256-GCM | Encryption for vault passwords |
| Helmet.js | Security headers |
| CORS | Cross-origin resource sharing |

### Database & ORM
| Technology | Purpose |
|------------|---------|
| node-postgres (pg) | PostgreSQL driver |
| Raw SQL with prepared statements | SQL injection prevention |
| UUID v4 | Primary key generation |

### DevOps & Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local orchestration |
| GitHub Actions | CI/CD automation |
| Snyk | Security scanning |
| Codecov | Test coverage reporting |

### Frontend
| Technology | Purpose |
|------------|---------|
| Vanilla JavaScript | Core functionality |
| Chart.js | Budget visualization |
| ExcelJS | Excel export functionality |
| Fetch API | HTTP requests |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Jest | Unit testing |
| Supertest | Integration testing |
| Cypress | E2E testing |
| Nodemon | Development auto-reload |

### Monitoring & Logging
| Tool | Purpose |
|------|---------|
| Winston | Structured logging |
| Health check endpoints | Service monitoring |
| Prometheus-ready metrics | Performance monitoring |

## Features

### Core Features
- **Kanban Board**: Drag-and-drop task management with three states (To Do, In Progress, Done)
- **Calendar View**: Month-based scheduling with unscheduled task list
- **Password Vault**: Secure storage for credentials with encryption
- **Budget Tracker**: Expense and savings tracking with Excel export

### Security Features
- JWT-based authentication with 7-day expiration
- AES-256-GCM encryption for sensitive vault data
- Password hashing with bcrypt (12 rounds)
- Rate limiting per IP address
- SQL injection prevention through parameterized queries
- XSS protection via content security policies
- CORS configuration for allowed origins

### User Experience
- Light/Dark theme toggle with persistence
- Responsive design for desktop and tablet
- Guest mode for trial users
- Real-time updates across views
- Export/Import functionality for data backup

### DevOps Features
- Multi-stage Docker builds
- Health check endpoints
- Structured logging with multiple transports
- CI/CD pipeline with automated testing
- Environment-based configuration
- Secrets management through environment variables

## Prerequisites

### Required Software
- Node.js 18.x or higher
- PostgreSQL 15.x or higher
- Redis 7.x or higher (optional, falls back to memory store)
- Docker 20.x or higher (for containerized deployment)
- Docker Compose 2.x or higher (for local orchestration)

### System Requirements
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum (8GB recommended for production)
- **Storage**: 10GB minimum for database and logs
- **Network**: Static IP or domain name recommended for production

### Environment Requirements
- Port 3000 accessible (configurable)
- PostgreSQL port 5432 accessible
- Redis port 6379 accessible (optional)

## Installation

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/your-org/myboard.git
cd myboard
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Generate required secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate encryption key (32 bytes hex)
openssl rand -hex 32

# Update .env with generated values
```

4. Start the application:
```bash
# Development with hot reload
docker-compose -f docker/docker-compose.yml up

# Production mode
docker-compose -f docker/docker-compose.prod.yml up -d
```

5. Access the application:
```
http://localhost:3000
```

### Manual Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15

# macOS
brew install postgresql@15

# Windows
# Download installer from https://www.postgresql.org/download/windows/
```

3. Create database:
```bash
sudo -u postgres psql
CREATE DATABASE myboard;
CREATE USER myboard WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE myboard TO myboard;
\q
```

4. Run migrations:
```bash
npm run migrate
```

5. Seed demo data (optional):
```bash
npm run seed
```

6. Start application:
```bash
# Development
npm run dev

# Production
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Environment mode | Yes | development | production |
| `PORT` | Server port | Yes | 3000 | 8080 |
| `JWT_SECRET` | JWT signing secret | Yes | - | 32+ character random string |
| `SESSION_SECRET` | Session encryption | Yes | - | 32+ character random string |
| `ENCRYPTION_KEY` | AES-256-GCM key (32 bytes hex) | Yes | - | 64 character hex string |
| `DATABASE_URL` | PostgreSQL connection | Yes | - | postgresql://user:pass@host:5432/db |
| `REDIS_URL` | Redis connection | No | - | redis://localhost:6379 |
| `LOG_LEVEL` | Logging verbosity | No | info | debug, info, warn, error |
| `LOG_FORMAT` | Log output format | No | json | json, simple |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | No | 900000 | 60000 |
| `RATE_LIMIT_MAX` | Max requests per window | No | 100 | 60 |
| `ENABLE_GUEST_MODE` | Guest login availability | No | true | true, false |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | No | * | https://app.example.com,https://api.example.com |

### Security Configuration

#### JWT Secret Generation
```bash
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Encryption Key Generation
```bash
# Generate 32-byte key for AES-256-GCM
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Configuration

**Connection Pool Settings**
```javascript
{
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000 // Return error after 2 seconds
}
```

## Security

### Authentication Flow

1. User submits credentials
2. Server validates and hashes password with bcrypt
3. JWT token generated with 7-day expiration
4. Token stored client-side (localStorage)
5. Token sent in Authorization header for subsequent requests

### Data Encryption

- **Passwords**: bcrypt with 12 rounds, stored as hash
- **Vault Entries**: AES-256-GCM encryption with unique IV per entry
- **Session Data**: Signed cookies with rotation
- **Database**: TLS/SSL encryption in transit (production)

### Security Headers (Helmet.js)

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Rate Limiting

- **Authentication**: 5 attempts per 15 minutes
- **API**: 100 requests per 15 minutes per IP
- **File Upload**: 10 uploads per hour

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
Authenticate existing user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "last_login": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/guest
Create guest session

**Response:**
```json
{
  "user": {
    "id": "guest_1234567890",
    "username": "Guest_a1b2c3",
    "isGuest": true
  },
  "token": "jwt_token_here",
  "isGuest": true
}
```

### Task Management Endpoints

#### GET /api/tasks
Retrieve user tasks with pagination

**Query Parameters:**
- `status`: Filter by status (todo, inprogress, done)
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project proposal",
      "description": "Write and submit Q4 proposal",
      "due_date": "2024-01-15",
      "priority": "high",
      "status": "inprogress",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

#### POST /api/tasks
Create new task

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit Q4 proposal",
  "due_date": "2024-01-15",
  "priority": "high",
  "status": "todo"
}
```

#### PUT /api/tasks/:id
Update existing task

**Request Body:**
```json
{
  "status": "done",
  "title": "Updated title"
}
```

#### DELETE /api/tasks/:id
Delete task

### Vault Endpoints

#### GET /api/vault/entries
Retrieve all vault entries (encrypted response)

#### POST /api/vault/entries
Create new vault entry

**Request Body:**
```json
{
  "site_name": "GitHub",
  "username": "john_doe",
  "password": "mySecurePassword"
}
```

#### GET /api/vault/entries/:id/decrypt
Retrieve decrypted password (requires additional authentication)

### Budget Endpoints

#### GET /api/budget/entries
Retrieve budget entries with date range filtering

**Query Parameters:**
- `start_date`: YYYY-MM-DD format
- `end_date`: YYYY-MM-DD format

#### POST /api/budget/entries
Add budget entry

**Request Body:**
```json
{
  "date": "2024-01-01",
  "type": "Expense",
  "category": "Food",
  "amount": 45.50
}
```

#### GET /api/budget/summary
Get budget summary with totals

**Response:**
```json
{
  "total_money": 5000.00,
  "expenses": 1240.50,
  "savings": 850.00,
  "remaining": 2909.50
}
```

#### GET /api/budget/export/excel
Download Excel report with charts

### Health and Monitoring

#### GET /health
Application health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "version": "2.0.0"
}
```

#### GET /metrics
Application metrics (requires admin authentication)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) CHECK (status IN ('todo', 'inprogress', 'done')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Vault Entries Table
```sql
CREATE TABLE vault_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_name VARCHAR(200) NOT NULL,
    username VARCHAR(200) NOT NULL,
    password_encrypted JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vault_entries_user_id ON vault_entries(user_id);
```

### Budget Entries Table
```sql
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Expense', 'Savings')),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budget_entries_user_id ON budget_entries(user_id);
CREATE INDEX idx_budget_entries_date ON budget_entries(date);
```

## Development

### Setting Up Development Environment

1. Install dependencies:
```bash
npm install
```

2. Copy development environment:
```bash
cp .env.example .env.development
```

3. Start development database:
```bash
docker-compose -f docker/docker-compose.yml up postgres redis
```

4. Run migrations:
```bash
NODE_ENV=development npm run migrate
```

5. Start development server with hot reload:
```bash
npm run dev
```

### Code Structure

```
src/
├── server/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration modules
│   ├── controllers/        # Route handlers
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── db/                 # Database migrations
└── client/
    ├── public/             # Static assets
    ├── css/                # Stylesheets
    ├── js/                 # Client-side JavaScript
    └── assets/             # Images and icons
```

### Coding Standards

- **JavaScript**: ES6+ syntax, async/await over callbacks
- **Error Handling**: Centralized error middleware
- **Logging**: Winston with structured JSON logs
- **Validation**: express-validator for request validation
- **Comments**: JSDoc for public functions

## Testing

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── services/          # Service layer tests
│   ├── models/            # Model tests
│   └── controllers/       # Controller tests
├── integration/           # Integration tests
│   ├── api/               # API endpoint tests
│   └── database/          # Database integration
└── e2e/                   # End-to-end tests
    └── flows/             # User journey tests
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Coverage Requirements

- **Services**: 90% coverage
- **Controllers**: 85% coverage
- **Models**: 80% coverage
- **Utils**: 80% coverage

### Writing Tests Example

**Unit Test Example:**
```javascript
const { authService } = require('../../../src/server/services/authService');

describe('AuthService', () => {
  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
```

## Deployment

### Production Requirements

- **Database**: Managed PostgreSQL (AWS RDS, Azure Database, or self-hosted)
- **Cache**: Redis (ElastiCache, Memorystore, or self-hosted)
- **Application**: Container orchestration (Kubernetes, ECS, or VM)
- **Load Balancer**: Nginx or cloud load balancer
- **SSL/TLS**: Let's Encrypt or commercial certificate

### Deployment Strategies

#### Docker Compose (Small Scale)
```bash
# Production configuration
docker-compose -f docker/docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker/docker-compose.prod.yml up -d --scale app=3
```

#### Kubernetes (Enterprise)
```yaml
# Example deployment manifest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myboard-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myboard-api
  template:
    metadata:
      labels:
        app: myboard-api
    spec:
      containers:
      - name: api
        image: ghcr.io/your-org/myboard:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: myboard-secrets
```

### CI/CD Pipeline

The GitHub Actions pipeline includes:

1. **Lint Stage**: ESLint and Prettier checks
2. **Test Stage**: Unit, integration, and security tests
3. **Build Stage**: Docker image build and scanning
4. **Deploy Stage**: Container registry push and deployment

### Environment Promotion

```
Development → Staging → Production

Development: Feature branches, auto-deploy
Staging: Release candidates, integration testing
Production: Tagged releases, blue-green deployment
```

### Backup Strategy

- **Database**: Daily automated backups with 30-day retention
- **Configuration**: Infrastructure as Code (Terraform/CloudFormation)
- **User Data**: Encrypted backups with point-in-time recovery

## Monitoring

### Health Checks

- **/health**: Basic service health
- **/metrics**: Prometheus metrics
- **/ready**: Readiness probe for load balancers
- **/live**: Liveness probe for container orchestration

### Logging

**Log Levels:**
- ERROR: Critical failures requiring immediate attention
- WARN: Potential issues that don't affect core functionality
- INFO: Normal application flow and user actions
- DEBUG: Detailed information for development
- TRACE: Very detailed debugging (development only)

**Log Format (JSON):**
```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "myboard-api",
  "userId": "uuid",
  "requestId": "uuid",
  "duration": 45
}
```

### Metrics to Monitor

- **Application**: Request rate, error rate, response time
- **Database**: Connection pool usage, query performance
- **System**: CPU, memory, disk usage
- **Business**: Active users, task creation rate, budget entries

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Error Rate | >1% | >5% |
| Response Time (p95) | >500ms | >2s |
| Database Connections | >80% pool | >95% pool |
| Memory Usage | >70% | >90% |

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection string
psql $DATABASE_URL

# Check connection limit
SELECT count(*) FROM pg_stat_activity;
```

**Authentication Errors**
```bash
# Verify JWT secret length
echo $JWT_SECRET | wc -c

# Test token validation
node -e "require('jsonwebtoken').verify('token', 'secret')"
```

**Performance Issues**
```bash
# Check slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 'uuid';
```

### Support Resources

- **Documentation**: [https://docs.myboard.example.com](https://docs.myboard.example.com)
- **Issue Tracker**: [https://github.com/your-org/myboard/issues](https://github.com/your-org/myboard/issues)
- **Security Reports**: security@myboard.example.com
- **Community Forum**: [https://community.myboard.example.com](https://community.myboard.example.com)

## License

MIT License

Copyright (c) 2024 MyBoard Enterprise

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-01-01 | Major refactor: PostgreSQL integration, full API, enterprise security |
| 1.0.0 | 2023-01-01 | Initial release with localStorage only |

## Contributors

- Core Team: engineering@myboard.example.com
- Security Auditors: security@myboard.example.com
- Documentation: docs@myboard.example.com

## Acknowledgments

- PostgreSQL for reliable database management
- Node.js community for excellent tooling
- Open source security researchers
```
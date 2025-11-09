# Task 1: Project Initialization and Setup

## Objective
Initialize a production-ready Node.js + TypeScript + Serverless Framework project with proper folder structure, dependencies, and configuration.

## Prerequisites
- Node.js 22.x LTS installed (latest stable)
- npm 10.x or yarn 4.x installed
- AWS CLI configured
- Git installed
- Supabase account

## Step-by-Step Instructions

### 1. Initialize Node.js Project

```bash
cd /Users/admin/Documents/others/resume/resumeBuilder/resumeBuilderBackend

# Initialize package.json
npm init -y

# Update package.json name and description
```

### 2. Install Core Dependencies

```bash
# Production dependencies
npm install express@^4.21.2
npm install @prisma/client@^6.1.0
npm install @supabase/supabase-js@^2.47.10
npm install stripe@^17.5.0
npm install dotenv@^16.4.7
npm install cors@^2.8.5
npm install helmet@^8.0.0
npm install winston@^3.17.0
npm install joi@^17.13.3

# Prisma CLI (dev dependency)
npm install --save-dev prisma@^6.1.0

# Development dependencies
npm install --save-dev typescript@^5.7.2
npm install --save-dev @types/node@^22.10.2
npm install --save-dev @types/express@^5.0.0
npm install --save-dev @types/cors@^2.8.17
npm install --save-dev serverless@^4.6.1
npm install --save-dev serverless-offline@^14.4.0
npm install --save-dev serverless-dotenv-plugin@^6.0.0
npm install --save-dev @types/aws-lambda@^8.10.145
npm install --save-dev ts-node@^10.9.2
npm install --save-dev nodemon@^3.1.9
npm install --save-dev eslint@^9.17.0
npm install --save-dev @typescript-eslint/parser@^8.19.1
npm install --save-dev @typescript-eslint/eslint-plugin@^8.19.1
npm install --save-dev prettier@^3.4.2
npm install --save-dev jest@^29.7.0
npm install --save-dev @types/jest@^29.5.14
npm install --save-dev ts-jest@^29.2.5
npm install --save-dev supertest@^7.0.0
npm install --save-dev @types/supertest@^6.0.2
```

### 3. Create Folder Structure

```bash
mkdir -p src/{handlers,services,models,middleware,utils,types,config}
mkdir -p tests/{unit,integration}
mkdir -p docs/prompts
```

### 4. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 5. Configure Serverless Framework

Create `serverless.yml`:

```yaml
service: resume-builder-api

frameworkVersion: '4'

provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 512
  timeout: 30
  environment:
    NODE_ENV: ${self:provider.stage}
    DATABASE_URL: ${env:DATABASE_URL}
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_KEY: ${env:SUPABASE_KEY}
    SUPABASE_SERVICE_KEY: ${env:SUPABASE_SERVICE_KEY}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}
    STRIPE_WEBHOOK_SECRET: ${env:STRIPE_WEBHOOK_SECRET}
    JWT_SECRET: ${env:JWT_SECRET}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: '*'

functions:
  api:
    handler: dist/handlers/index.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY

plugins:
  - serverless-offline
  - serverless-dotenv-plugin

custom:
  serverless-offline:
    httpPort: 3000
    
package:
  patterns:
    - '!node_modules/.prisma/client/libquery_engine-*'
    - 'node_modules/.prisma/client/libquery_engine-rhel-*'
    - '!node_modules/prisma/libquery_engine-*'
    - '!node_modules/@prisma/engines/**'
```

### 6. Configure ESLint

Create `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "no-console": "warn"
  }
}
```

### 7. Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 8. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "serverless offline",
    "build": "prisma generate && tsc",
    "deploy:dev": "npm run build && serverless deploy --stage dev",
    "deploy:prod": "npm run build && serverless deploy --stage prod",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

### 9. Create Environment Files

Create `.env.example`:

```env
# Database (Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# JWT
JWT_SECRET=your_jwt_secret_key

# Frontend
FRONTEND_URL=http://localhost:5173

# AWS
AWS_REGION=us-east-1

# Environment
NODE_ENV=development
```

Create `.env` (copy from .env.example and fill in values)

### 9a. Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (if not exists)
```

Update `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  fullName              String?   @map("full_name")
  avatarUrl             String?   @map("avatar_url")
  
  // Subscription info
  subscriptionTier      String    @default("free") @map("subscription_tier")
  subscriptionStatus    String    @default("active") @map("subscription_status")
  subscriptionExpiresAt DateTime? @map("subscription_expires_at")
  trialEndsAt           DateTime? @map("trial_ends_at")
  stripeCustomerId      String?   @unique @map("stripe_customer_id")
  
  // Usage tracking
  resumeCount           Int       @default(0) @map("resume_count")
  exportCount           Int       @default(0) @map("export_count")
  storageUsedBytes      BigInt    @default(0) @map("storage_used_bytes")
  
  // Preferences
  preferences           Json      @default("{}")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastLoginAt           DateTime? @map("last_login_at")
  isActive              Boolean   @default(true) @map("is_active")
  deletedAt             DateTime? @map("deleted_at")
  
  // Relations
  resumes               Resume[]
  subscriptions         Subscription[]
  payments              Payment[]
  
  @@map("users")
}

model Resume {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  
  // Resume metadata
  title             String
  description       String?
  templateId        String    @map("template_id")
  
  // Resume content (JSONB)
  content           Json
  
  // Version control
  version           Int       @default(1)
  isCurrentVersion  Boolean   @default(true) @map("is_current_version")
  parentVersionId   String?   @map("parent_version_id")
  
  // Status
  status            String    @default("draft")
  isPublic          Boolean   @default(false) @map("is_public")
  publicSlug        String?   @unique @map("public_slug")
  
  // ATS metrics
  atsScore          Int?      @map("ats_score")
  atsIssues         Json      @default("[]") @map("ats_issues")
  lastAtsCheckAt    DateTime? @map("last_ats_check_at")
  
  // Analytics
  viewCount         Int       @default(0) @map("view_count")
  exportCount       Int       @default(0) @map("export_count")
  lastExportedAt    DateTime? @map("last_exported_at")
  
  // Metadata
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")
  
  // Relations
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  versions          ResumeVersion[]
  
  @@index([userId])
  @@index([templateId])
  @@index([status])
  @@index([publicSlug])
  @@map("resumes")
}

model ResumeVersion {
  id              String   @id @default(uuid())
  resumeId        String   @map("resume_id")
  userId          String   @map("user_id")
  
  // Version info
  versionNumber   Int      @map("version_number")
  versionName     String?  @map("version_name")
  
  // Snapshot
  content         Json
  templateId      String   @map("template_id")
  
  // Metadata
  createdAt       DateTime @default(now()) @map("created_at")
  createdBy       String?  @map("created_by")
  
  // Change tracking
  changesSummary  String?  @map("changes_summary")
  diff            Json?
  
  // Relations
  resume          Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@unique([resumeId, versionNumber])
  @@index([resumeId])
  @@index([userId])
  @@map("resume_versions")
}

model Subscription {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  planId                String    @map("plan_id")
  
  // Subscription details
  status                String    @default("active")
  billingCycle          String?   @map("billing_cycle")
  
  // Dates
  startedAt             DateTime  @default(now()) @map("started_at")
  currentPeriodStart    DateTime  @map("current_period_start")
  currentPeriodEnd      DateTime  @map("current_period_end")
  cancelledAt           DateTime? @map("cancelled_at")
  trialStart            DateTime? @map("trial_start")
  trialEnd              DateTime? @map("trial_end")
  
  // Stripe integration
  stripeSubscriptionId  String?   @unique @map("stripe_subscription_id")
  stripeCustomerId      String?   @map("stripe_customer_id")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments              Payment[]
  
  @@index([userId])
  @@index([status])
  @@index([stripeSubscriptionId])
  @@map("subscriptions")
}

model Payment {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  subscriptionId        String?   @map("subscription_id")
  
  // Payment details
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  status                String
  
  // Payment method
  paymentMethod         String?   @map("payment_method")
  paymentProviderId     String?   @map("payment_provider_id")
  
  // Stripe integration
  stripePaymentIntentId String?   @unique @map("stripe_payment_intent_id")
  stripeChargeId        String?   @map("stripe_charge_id")
  
  // Metadata
  description           String?
  metadata              Json      @default("{}")
  
  // Dates
  paidAt                DateTime? @map("paid_at")
  refundedAt            DateTime? @map("refunded_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription          Subscription? @relation(fields: [subscriptionId], references: [id])
  
  @@index([userId])
  @@index([subscriptionId])
  @@index([status])
  @@index([stripePaymentIntentId])
  @@map("payments")
}

// Add more models as needed...
```

Generate Prisma Client:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or create migration (for production)
npx prisma migrate dev --name init
```

### 10. Create .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
.build/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Serverless
.serverless/

# Tests
coverage/
.nyc_output/
```

### 11. Create Initial Handler

Create `src/handlers/index.ts`:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

export const handler: APIGatewayProxyHandler = serverless(app);
```

### 12. Create Configuration File

Create `src/config/index.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 12a. Create Prisma Client Singleton

Create `src/utils/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 13. Initialize Git

```bash
git init
git add .
git commit -m "Initial project setup"
```

### 14. Test Setup

```bash
# Build TypeScript
npm run build

# Start local server
npm run dev

# Test health endpoint
curl http://localhost:3000/health
```

## Deliverables

✅ package.json with all dependencies
✅ tsconfig.json configured
✅ serverless.yml configured
✅ Folder structure created
✅ ESLint and Prettier configured
✅ Environment variables set up
✅ Initial handler working
✅ Configuration management
✅ Git repository initialized
✅ Health check endpoint working

## Verification

Run these commands to verify setup:

```bash
# Check TypeScript compilation
npm run build

# Check linting
npm run lint

# Start local server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Next Steps

Once this task is complete:
1. Commit changes to Git
2. Proceed to Task 2: Supabase Setup
3. Create database schema
4. Set up authentication

## Troubleshooting

**Issue:** TypeScript compilation errors
**Solution:** Check tsconfig.json and ensure all @types packages are installed

**Issue:** Serverless offline not starting
**Solution:** Check serverless.yml syntax and ensure all plugins are installed

**Issue:** Environment variables not loading
**Solution:** Ensure .env file exists and serverless-dotenv-plugin is configured

## Notes

- Keep .env file secure and never commit it
- Use .env.example as template for team members
- Update dependencies regularly for security patches
- Follow TypeScript strict mode for better type safety
- Use meaningful commit messages

**Task 1 Complete! Ready for Task 2: Supabase Setup**

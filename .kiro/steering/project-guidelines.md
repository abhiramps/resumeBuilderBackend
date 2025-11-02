---
inclusion: always
---

# Resume Builder Backend - Project Guidelines

## Project Context

This is the **Resume Builder Backend** - a serverless API built with Node.js, TypeScript, Prisma ORM, and deployed on AWS Lambda. It provides authentication, resume management, subscription handling, and payment processing.

**Current Status:** Task 0 (Ready to start)
**Architecture:** Hybrid (Supabase + AWS Lambda + Prisma)
**Frontend:** React on Vercel (Task 35 complete)

## Core Principles

### 1. Type Safety First
- Use TypeScript strict mode
- Prisma for type-safe database access
- No `any` types without justification
- Define interfaces for all API requests/responses

### 2. Security by Default
- JWT authentication on all protected routes
- Row Level Security (RLS) in database
- Input validation on all endpoints
- Rate limiting and CORS configuration
- Never expose sensitive data

### 3. Serverless Architecture
- Stateless Lambda functions
- Connection pooling for database
- Optimize for cold starts
- Keep functions small and focused

## Technology Stack

### Core (Latest Stable Versions)
- **Node.js:** 22.x LTS
- **TypeScript:** 5.7.2
- **Serverless Framework:** 4.6.1
- **Express:** 4.21.2

### Database & ORM
- **Database:** Supabase PostgreSQL
- **ORM:** Prisma 6.1.0
- **Auth:** Supabase Auth

### Payments & Services
- **Stripe:** 17.5.0
- **Winston:** 3.17.0 (logging)
- **Joi:** 17.13.3 (validation)

## Project Structure

```
src/
├── handlers/          # Lambda function handlers
│   ├── index.ts       # Main API handler
│   ├── auth.ts        # Auth endpoints
│   ├── resumes.ts     # Resume endpoints
│   ├── subscriptions.ts
│   └── webhooks.ts
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── resume.service.ts
│   ├── subscription.service.ts
│   └── stripe.service.ts
├── middleware/        # Express middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── utils/             # Utility functions
│   ├── prisma.ts      # Prisma client singleton
│   ├── supabase.ts    # Supabase client
│   └── logger.ts      # Winston logger
├── types/             # TypeScript types
│   ├── user.types.ts
│   ├── resume.types.ts
│   └── api.types.ts
└── config/            # Configuration
    └── index.ts
```

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types
interface CreateResumeRequest {
  title: string;
  templateId: string;
  content: ResumeContent;
}

interface CreateResumeResponse {
  id: string;
  title: string;
  createdAt: string;
}

// ❌ Bad: Implicit any
const createResume = async (req, res) => {
  const data = req.body; // any type
};
```

### API Handlers

```typescript
// ✅ Good: Typed handler with error handling
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createResumeSchema } from '../validators/resume.validators';

const router = Router();

router.post(
  '/resumes',
  authenticate,
  validateRequest(createResumeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const resume = await resumeService.create(req.user!.id, req.body);
      res.status(201).json(resume);
    } catch (error) {
      next(error);
    }
  }
);

// ❌ Bad: Untyped handler without error handling
router.post('/resumes', async (req, res) => {
  const resume = await resumeService.create(req.body);
  res.json(resume);
});
```

### Service Layer

```typescript
// ✅ Good: Service with Prisma
import { prisma } from '../utils/prisma';
import { Resume, CreateResumeData } from '../types/resume.types';

export class ResumeService {
  async create(userId: string, data: CreateResumeData): Promise<Resume> {
    // Check subscription limits
    const canCreate = await this.checkResumeLimit(userId);
    if (!canCreate) {
      throw new ForbiddenError('Resume limit reached for your subscription tier');
    }
    
    const resume = await prisma.resume.create({
      data: {
        userId,
        title: data.title,
        templateId: data.templateId,
        content: data.content,
        status: 'draft',
      },
    });
    
    return resume;
  }
  
  async getById(resumeId: string, userId: string): Promise<Resume> {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
      },
    });
    
    if (!resume) {
      throw new NotFoundError('Resume not found');
    }
    
    return resume;
  }
}

// ❌ Bad: Direct database access in handler
router.get('/resumes/:id', async (req, res) => {
  const resume = await prisma.resume.findUnique({
    where: { id: req.params.id },
  });
  res.json(resume);
});
```

## File Naming Conventions

- **Handlers:** camelCase (e.g., `auth.ts`, `resumes.ts`)
- **Services:** camelCase with `.service.ts` suffix (e.g., `auth.service.ts`)
- **Middleware:** camelCase with `.middleware.ts` suffix (e.g., `auth.middleware.ts`)
- **Types:** camelCase with `.types.ts` suffix (e.g., `user.types.ts`)
- **Utils:** camelCase (e.g., `prisma.ts`, `logger.ts`)

## Prisma Best Practices

### 1. Use Singleton Pattern
```typescript
// ✅ Good: Singleton in src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ❌ Bad: New instance everywhere
const prisma = new PrismaClient();
```

### 2. Type-Safe Queries
```typescript
// ✅ Good: Fully typed
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    resumes: {
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    },
  },
});
// TypeScript knows all properties

// ❌ Bad: Raw SQL without types
const user = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

### 3. Transactions
```typescript
// ✅ Good: Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' },
  });
  
  await tx.resume.create({
    data: {
      userId: user.id,
      title: 'My Resume',
      templateId: 'modern',
    },
  });
});

// ❌ Bad: Separate operations without transaction
const user = await prisma.user.create({ data: { email: 'user@example.com' } });
await prisma.resume.create({ data: { userId: user.id, title: 'Resume' } });
```

### 4. Error Handling
```typescript
// ✅ Good: Handle Prisma errors
import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email: 'test@example.com' } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictError('Email already exists');
    }
  }
  throw error;
}
```

## Authentication & Authorization

### JWT Middleware
```typescript
// ✅ Good: Typed auth middleware
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    
    req.user = {
      id: user.id,
      email: user.email!,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};
```

### Subscription Limits
```typescript
// ✅ Good: Check subscription limits
export const checkResumeLimit = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'active' },
      },
    },
  });
  
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: user?.subscriptionTier || 'free' },
  });
  
  const maxResumes = (plan?.features as any).maxResumes;
  
  // -1 means unlimited
  if (maxResumes === -1) return true;
  
  const resumeCount = await prisma.resume.count({
    where: {
      userId,
      deletedAt: null,
    },
  });
  
  return resumeCount < maxResumes;
};
```

## Input Validation

### Using Joi
```typescript
// ✅ Good: Validation schema
import Joi from 'joi';

export const createResumeSchema = Joi.object({
  title: Joi.string().required().min(1).max(255),
  templateId: Joi.string().required().valid('classic', 'modern', 'minimal', 'abhiram'),
  content: Joi.object({
    personalInfo: Joi.object().required(),
    sections: Joi.array().required(),
    layout: Joi.object().required(),
  }).required(),
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    
    next();
  };
};
```

## Error Handling

### Custom Error Classes
```typescript
// ✅ Good: Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}
```

### Error Middleware
```typescript
// ✅ Good: Centralized error handling
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', error);
  
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

## Logging

### Winston Logger
```typescript
// ✅ Good: Structured logging
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Usage
logger.info('User created', { userId: user.id, email: user.email });
logger.error('Failed to create resume', { error, userId });

// ❌ Bad: Console.log
console.log('User created:', user.id);
```

## Stripe Integration

### Webhook Handling
```typescript
// ✅ Good: Verify webhook signature
import Stripe from 'stripe';
import { stripe } from '../services/stripe.service';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// ❌ Bad: No signature verification
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  // Process without verification - SECURITY RISK!
};
```

## Testing

### Unit Tests
```typescript
// ✅ Good: Test service logic
import { ResumeService } from '../services/resume.service';
import { prisma } from '../utils/prisma';

jest.mock('../utils/prisma');

describe('ResumeService', () => {
  let resumeService: ResumeService;
  
  beforeEach(() => {
    resumeService = new ResumeService();
  });
  
  describe('create', () => {
    it('should create a resume', async () => {
      const mockResume = {
        id: 'uuid',
        userId: 'user-id',
        title: 'My Resume',
        templateId: 'modern',
      };
      
      (prisma.resume.create as jest.Mock).mockResolvedValue(mockResume);
      
      const result = await resumeService.create('user-id', {
        title: 'My Resume',
        templateId: 'modern',
        content: {},
      });
      
      expect(result).toEqual(mockResume);
      expect(prisma.resume.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id',
          title: 'My Resume',
        }),
      });
    });
  });
});
```

### Integration Tests
```typescript
// ✅ Good: Test API endpoints
import request from 'supertest';
import app from '../app';

describe('Resume API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Sign in and get token
    const response = await request(app)
      .post('/auth/signin')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = response.body.session.access_token;
  });
  
  describe('POST /resumes', () => {
    it('should create a resume', async () => {
      const response = await request(app)
        .post('/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Resume',
          templateId: 'modern',
          content: { personalInfo: {}, sections: [] },
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('My Resume');
    });
    
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/resumes')
        .send({ title: 'My Resume' });
      
      expect(response.status).toBe(401);
    });
  });
});
```

## Environment Variables

```typescript
// ✅ Good: Validate environment variables
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
  },
};

// Validate required variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## API Response Format

### Success Response
```typescript
// ✅ Good: Consistent response format
interface SuccessResponse<T> {
  data: T;
  message?: string;
}

// Single resource
res.status(200).json({
  data: resume,
});

// List with pagination
res.status(200).json({
  data: resumes,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
  },
});
```

### Error Response
```typescript
// ✅ Good: Consistent error format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

res.status(400).json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    details: {
      field: 'email',
      value: 'invalid-email',
    },
  },
});
```

## Database Migrations

```bash
# ✅ Good: Use Prisma migrations
# Development
npx prisma migrate dev --name add_ats_score

# Production
npx prisma migrate deploy

# ❌ Bad: Manual SQL changes
# Don't modify database directly
```

## Deployment

### Serverless Configuration
```yaml
# ✅ Good: Optimized for Lambda
service: resume-builder-api

frameworkVersion: '4'

provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  memorySize: 512
  timeout: 30
  environment:
    DATABASE_URL: ${env:DATABASE_URL}

functions:
  api:
    handler: dist/handlers/index.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY

# Optimize Prisma for Lambda
package:
  patterns:
    - '!node_modules/.prisma/client/libquery_engine-*'
    - 'node_modules/.prisma/client/libquery_engine-rhel-*'
```

## Security Checklist

- [ ] All routes use authentication middleware
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (sanitize inputs)
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Secrets in environment variables
- [ ] HTTPS only
- [ ] Stripe webhook signature verification
- [ ] Row Level Security in database

## Performance Optimization

### Connection Pooling
```typescript
// ✅ Good: Reuse Prisma client
import { prisma } from '../utils/prisma';

// Prisma handles connection pooling automatically
```

### Caching
```typescript
// ✅ Good: Cache subscription plans
let cachedPlans: SubscriptionPlan[] | null = null;

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  if (cachedPlans) {
    return cachedPlans;
  }
  
  cachedPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
  });
  
  return cachedPlans;
};
```

## Git Commit Messages

```bash
# ✅ Good: Descriptive commits
feat: implement resume CRUD operations (Task 11)
fix: resolve Stripe webhook signature verification
refactor: extract subscription logic to service
test: add integration tests for auth endpoints

# ❌ Bad: Vague commits
update code
fix bug
changes
```

## Common Pitfalls to Avoid

### 1. Don't Create New Prisma Instances
```typescript
// ❌ Bad
const prisma = new PrismaClient();

// ✅ Good
import { prisma } from '../utils/prisma';
```

### 2. Don't Expose Sensitive Data
```typescript
// ❌ Bad
res.json(user); // Includes password hash, etc.

// ✅ Good
res.json({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
});
```

### 3. Don't Skip Error Handling
```typescript
// ❌ Bad
router.post('/resumes', async (req, res) => {
  const resume = await resumeService.create(req.body);
  res.json(resume);
});

// ✅ Good
router.post('/resumes', async (req, res, next) => {
  try {
    const resume = await resumeService.create(req.body);
    res.json(resume);
  } catch (error) {
    next(error);
  }
});
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Serverless Framework](https://www.serverless.com/framework/docs)
- [Stripe API](https://stripe.com/docs/api)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Task Reference

Current progress: **Task 0 (Ready to start)**

See `docs/task_list.md` for complete task list (35 tasks).

## Questions?

When implementing features:
1. Follow the task list sequentially
2. Use Prisma for all database operations
3. Implement proper error handling
4. Write tests for new features
5. Validate all inputs
6. Log important events
7. Check subscription limits where applicable

**Remember:** Security and type safety are non-negotiable. Every endpoint must be authenticated and validated.

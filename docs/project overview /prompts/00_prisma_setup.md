# Prisma ORM Setup Guide

## Overview

This guide covers setting up Prisma ORM with Supabase PostgreSQL for the Resume Builder backend. Prisma provides type-safe database access, automatic migrations, and excellent developer experience.

## Why Prisma?

- ✅ **Type Safety**: Auto-generated TypeScript types
- ✅ **Developer Experience**: Intuitive API and great tooling
- ✅ **Migrations**: Version-controlled database schema
- ✅ **Performance**: Optimized queries and connection pooling
- ✅ **Supabase Compatible**: Works seamlessly with Supabase PostgreSQL

## Installation

### 1. Install Prisma

```bash
# Install Prisma CLI as dev dependency
npm install --save-dev prisma@^6.1.0

# Install Prisma Client
npm install @prisma/client@^6.1.0
```

### 2. Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Your database schema
- `.env` - Environment variables (if not exists)

## Configuration

### 1. Get Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Copy the "Connection string" under "Connection pooling"
4. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 2. Update .env

```env
# Direct connection (for migrations)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# Connection pooling (for production)
DATABASE_URL_POOLING="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

### 3. Configure schema.prisma

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  // For AWS Lambda deployment
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Use connection pooling in production
  directUrl = env("DATABASE_URL")
}
```

## Schema Design

### Complete Schema

Create `prisma/schema.prisma` with all models:

```prisma
// This is your Prisma schema file
// learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

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
  preferences           Json      @default("{\"theme\":\"light\",\"defaultTemplate\":\"modern\",\"autoSave\":true}")
  
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
  
  @@index([email])
  @@index([subscriptionTier])
  @@map("users")
}

// ============================================
// RESUME MANAGEMENT
// ============================================

model Resume {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  
  // Resume metadata
  title             String
  description       String?
  templateId        String    @map("template_id")
  
  // Resume content (JSONB for flexibility)
  content           Json      @default("{\"personalInfo\":{},\"sections\":[],\"layout\":{}}")
  
  // Version control
  version           Int       @default(1)
  isCurrentVersion  Boolean   @default(true) @map("is_current_version")
  parentVersionId   String?   @map("parent_version_id")
  
  // Status
  status            String    @default("draft") // draft, published, archived
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
  @@index([deletedAt])
  @@map("resumes")
}

model ResumeVersion {
  id              String   @id @default(uuid())
  resumeId        String   @map("resume_id")
  userId          String   @map("user_id")
  
  // Version info
  versionNumber   Int      @map("version_number")
  versionName     String?  @map("version_name")
  
  // Snapshot of resume at this version
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

model Template {
  id              String   @id
  name            String
  description     String?
  
  // Template configuration
  config          Json     @default("{\"layout\":{},\"styling\":{},\"sections\":[]}")
  
  // Template metadata
  thumbnailUrl    String?  @map("thumbnail_url")
  previewUrl      String?  @map("preview_url")
  category        String?
  tags            String[]
  
  // ATS info
  atsScore        Int?     @map("ats_score")
  isAtsFriendly   Boolean  @default(true) @map("is_ats_friendly")
  
  // Access control
  isPremium       Boolean  @default(false) @map("is_premium")
  requiredTier    String   @default("free") @map("required_tier")
  
  // Usage stats
  usageCount      Int      @default(0) @map("usage_count")
  
  // Metadata
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  isActive        Boolean  @default(true) @map("is_active")
  
  // Ordering
  sortOrder       Int      @default(0) @map("sort_order")
  
  @@index([category])
  @@index([isPremium])
  @@index([sortOrder])
  @@map("templates")
}

// ============================================
// SUBSCRIPTION & PAYMENTS
// ============================================

model SubscriptionPlan {
  id                    String   @id
  name                  String
  description           String?
  
  // Pricing
  priceMonthly          Decimal  @map("price_monthly") @db.Decimal(10, 2)
  priceYearly           Decimal? @map("price_yearly") @db.Decimal(10, 2)
  currency              String   @default("USD")
  
  // Features (JSONB)
  features              Json     @default("{\"maxResumes\":5,\"maxExportsPerMonth\":10,\"premiumTemplates\":false}")
  
  // Stripe integration
  stripePriceIdMonthly  String?  @map("stripe_price_id_monthly")
  stripePriceIdYearly   String?  @map("stripe_price_id_yearly")
  stripeProductId       String?  @map("stripe_product_id")
  
  // Metadata
  isActive              Boolean  @default(true) @map("is_active")
  sortOrder             Int      @default(0) @map("sort_order")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  
  @@map("subscription_plans")
}

model Subscription {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  planId                String    @map("plan_id")
  
  // Subscription details
  status                String    @default("active") // active, cancelled, expired, past_due, trial
  billingCycle          String?   @map("billing_cycle") // monthly, yearly
  
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
  @@index([currentPeriodEnd])
  @@map("subscriptions")
}

model Payment {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  subscriptionId        String?   @map("subscription_id")
  
  // Payment details
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("USD")
  status                String    // pending, succeeded, failed, refunded
  
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
  @@index([createdAt])
  @@map("payments")
}

// ============================================
// ADMIN & SYSTEM
// ============================================

model AdminUser {
  id          String    @id
  role        String    // super_admin, admin, moderator, support
  
  // Permissions (JSONB)
  permissions Json      @default("{\"manageUsers\":false,\"manageSubscriptions\":false}")
  
  // Metadata
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  lastLoginAt DateTime? @map("last_login_at")
  isActive    Boolean   @default(true) @map("is_active")
  
  @@index([role])
  @@map("admin_users")
}

model AuditLog {
  id              String   @id @default(uuid())
  
  // Event details
  eventType       String   @map("event_type")
  eventCategory   String   @map("event_category") // auth, resume, subscription, payment, admin, system
  
  // Actor
  userId          String?  @map("user_id")
  adminId         String?  @map("admin_id")
  ipAddress       String?  @map("ip_address")
  userAgent       String?  @map("user_agent")
  
  // Event data
  resourceType    String?  @map("resource_type")
  resourceId      String?  @map("resource_id")
  action          String?
  
  // Details
  details         Json     @default("{}")
  metadata        Json     @default("{}")
  
  // Status
  status          String?  // success, failure, error
  errorMessage    String?  @map("error_message")
  
  // Timestamp
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@index([userId])
  @@index([eventType])
  @@index([eventCategory])
  @@index([createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}

model FeatureFlag {
  id                  String   @id
  name                String
  description         String?
  
  // Flag configuration
  isEnabled           Boolean  @default(false) @map("is_enabled")
  rolloutPercentage   Int      @default(0) @map("rollout_percentage")
  
  // Targeting
  targetUsers         String[] @map("target_users")
  targetTiers         String[] @map("target_tiers")
  
  // Metadata
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  createdBy           String?  @map("created_by")
  
  @@map("feature_flags")
}
```

## Database Operations

### 1. Generate Prisma Client

```bash
# Generate TypeScript types and Prisma Client
npx prisma generate
```

This creates type-safe database client in `node_modules/@prisma/client`.

### 2. Push Schema to Database (Development)

```bash
# Push schema without creating migrations (good for rapid development)
npx prisma db push
```

### 3. Create Migrations (Production)

```bash
# Create a new migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy
```

### 4. Seed Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed subscription plans
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        features: {
          maxResumes: 3,
          maxExportsPerMonth: 10,
          premiumTemplates: false,
          customBranding: false,
          prioritySupport: false,
          analytics: false,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 9.99,
        priceYearly: 99.0,
        features: {
          maxResumes: 20,
          maxExportsPerMonth: 100,
          premiumTemplates: true,
          customBranding: true,
          prioritySupport: true,
          analytics: true,
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        priceMonthly: 29.99,
        priceYearly: 299.0,
        features: {
          maxResumes: -1, // unlimited
          maxExportsPerMonth: -1, // unlimited
          premiumTemplates: true,
          customBranding: true,
          prioritySupport: true,
          analytics: true,
          apiAccess: true,
          whiteLabel: true,
        },
      },
    ],
  });

  // Seed templates
  await prisma.template.createMany({
    data: [
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional chronological format',
        isPremium: false,
        atsScore: 98,
        sortOrder: 1,
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Clean, contemporary design',
        isPremium: false,
        atsScore: 95,
        sortOrder: 2,
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Ultra-clean, space-efficient',
        isPremium: false,
        atsScore: 97,
        sortOrder: 3,
      },
      {
        id: 'abhiram',
        name: 'Abhiram',
        description: 'Professional backend engineer template',
        isPremium: false,
        atsScore: 96,
        sortOrder: 4,
      },
    ],
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:

```bash
npx prisma db seed
```

## Using Prisma Client

### 1. Create Prisma Singleton

Create `src/utils/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

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

### 2. Example Usage

```typescript
import { prisma } from './utils/prisma';

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    fullName: 'John Doe',
  },
});

// Find user
const foundUser = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { resumes: true },
});

// Update user
await prisma.user.update({
  where: { id: user.id },
  data: { lastLoginAt: new Date() },
});

// Create resume
const resume = await prisma.resume.create({
  data: {
    userId: user.id,
    title: 'My Resume',
    templateId: 'modern',
    content: {
      personalInfo: {},
      sections: [],
      layout: {},
    },
  },
});

// Query with relations
const userWithResumes = await prisma.user.findUnique({
  where: { id: user.id },
  include: {
    resumes: {
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    },
    subscriptions: {
      where: { status: 'active' },
    },
  },
});
```

## Prisma Studio

Prisma Studio is a GUI for viewing and editing data:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`

## Best Practices

### 1. Connection Management

```typescript
// Good: Use singleton
import { prisma } from './utils/prisma';

// Bad: Create new instance
const prisma = new PrismaClient();
```

### 2. Error Handling

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email: 'test@example.com' } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

### 3. Transactions

```typescript
// Use transactions for multiple operations
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
```

### 4. Soft Deletes

```typescript
// Soft delete
await prisma.resume.update({
  where: { id: resumeId },
  data: { deletedAt: new Date() },
});

// Query excluding soft-deleted
const resumes = await prisma.resume.findMany({
  where: {
    userId: userId,
    deletedAt: null,
  },
});
```

## Deployment

### AWS Lambda Configuration

Update `serverless.yml`:

```yaml
package:
  patterns:
    - '!node_modules/.prisma/client/libquery_engine-*'
    - 'node_modules/.prisma/client/libquery_engine-rhel-*'
    - '!node_modules/prisma/libquery_engine-*'
    - '!node_modules/@prisma/engines/**'

functions:
  api:
    handler: dist/handlers/index.handler
    environment:
      DATABASE_URL: ${env:DATABASE_URL}
```

### Build Script

```json
{
  "scripts": {
    "build": "prisma generate && tsc",
    "deploy": "npm run build && serverless deploy"
  }
}
```

## Troubleshooting

### Issue: Prisma Client not found

```bash
npx prisma generate
```

### Issue: Connection timeout

Check DATABASE_URL and ensure Supabase project is running.

### Issue: Migration conflicts

```bash
# Reset database (development only!)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve
```

### Issue: Lambda deployment size

Prisma adds ~30MB. Use Lambda layers or optimize:

```yaml
package:
  individually: true
  patterns:
    - '!node_modules/.prisma/client/libquery_engine-*'
    - 'node_modules/.prisma/client/libquery_engine-rhel-*'
```

## Summary

✅ Prisma ORM installed and configured
✅ Complete schema defined
✅ Type-safe database access
✅ Migrations set up
✅ Seed data created
✅ Best practices documented
✅ Lambda deployment configured

**Next:** Proceed to Task 1 - Project Initialization

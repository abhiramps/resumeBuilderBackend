---
inclusion: always
---

# Resume Builder Backend - Architecture Recommendation

## Executive Summary

After evaluating multiple serverless architectures for a $0 hosting budget, I recommend a **hybrid approach** using AWS Free Tier services with Supabase for authentication and database. This provides the best balance of cost, scalability, developer experience, and feature completeness.

---

## 1. Recommended Architecture

### Primary Stack (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Vercel)                          │
│              React Resume Builder Frontend                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 API GATEWAY (AWS)                           │
│           REST API + WebSocket Support                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
│   Lambda     │ │ Lambda  │ │   Lambda    │
│   (Auth)     │ │(Resume) │ │  (Payment)  │
└───────┬──────┘ └──┬──────┘ └──┬──────────┘
        │           │            │
        │           │            │
┌───────▼───────────▼────────────▼──────────┐
│         SUPABASE (PostgreSQL)             │
│  - User Profiles                          │
│  - Resume Documents (JSONB)               │
│  - Subscriptions                          │
│  - Payment History                        │
│  - Row Level Security (RLS)               │
└───────────────────────────────────────────┘
        │
        │
┌───────▼───────────────────────────────────┐
│         STRIPE / PAYPAL                   │
│       Payment Processing                  │
└───────────────────────────────────────────┘
```

### Technology Stack

**Backend Framework:**
- Node.js 22.x LTS (latest stable)
- TypeScript 5.x
- Serverless Framework 4.x for deployment
- Express.js 4.x for Lambda handlers

**Database & ORM:**
- Supabase (PostgreSQL with 500MB free tier)
- Prisma ORM 6.x (latest stable)
- Type-safe database queries
- Automatic migrations
- Row Level Security (RLS)

**Authentication:**
- Supabase Auth (built-in)
- JWT tokens
- OAuth providers (Google, GitHub)
- Email/password authentication

**API Layer:**
- AWS API Gateway (1M requests/month free)
- Lambda functions (1M requests/month free)
- CloudWatch Logs (5GB free)

**Storage:**
- Supabase Storage (1GB free)
- S3 for backups (5GB free tier)

**Payment Processing:**
- Stripe (no monthly fee, pay per transaction)
- PayPal as alternative

**Admin Panel:**
- Separate React app or Next.js admin dashboard
- Deployed on Vercel

---

## 2. Why This Architecture?

### Advantages

✅ **Cost: $0 for MVP and early growth**
- Supabase: 500MB DB, 1GB storage, 2GB bandwidth (free forever)
- AWS Lambda: 1M requests/month free (400,000 GB-seconds)
- API Gateway: 1M API calls/month free (12 months)
- Vercel: Unlimited deployments for frontend

✅ **Developer Experience**
- Supabase provides instant REST API
- Built-in authentication
- Real-time capabilities
- PostgreSQL (familiar, powerful)
- TypeScript throughout

✅ **Scalability**
- Serverless auto-scales
- PostgreSQL handles complex queries
- Can migrate to dedicated DB later
- Easy to add caching (Redis)

✅ **Feature Rich**
- Row Level Security for multi-tenancy
- JSONB for flexible resume storage
- Full-text search built-in
- Real-time subscriptions
- File storage included

✅ **Security**
- Supabase RLS for data isolation
- JWT authentication
- HTTPS everywhere
- Automatic SQL injection prevention

### Limitations & Mitigation

⚠️ **Free Tier Limits:**
- Supabase: 500MB DB (enough for ~50,000 resumes)
- Lambda: 1M requests/month (~30 req/min sustained)
- **Mitigation:** Implement caching, optimize queries, monitor usage

⚠️ **Cold Starts:**
- Lambda functions may have 1-2s cold start
- **Mitigation:** Keep functions warm, use provisioned concurrency for critical paths

⚠️ **Vendor Lock-in:**
- Tied to AWS Lambda and Supabase
- **Mitigation:** Abstract database layer, use standard PostgreSQL queries

---

## 3. Alternative Architectures Considered

### Option A: Pure AWS (DynamoDB + Cognito)

```
Pros:
- All AWS ecosystem
- DynamoDB scales infinitely
- Cognito handles auth

Cons:
- DynamoDB learning curve (NoSQL)
- Complex access patterns
- Cognito UI is dated
- More code to write
- Harder to query/debug
```

**Verdict:** More complex, steeper learning curve, less developer-friendly

### Option B: Firebase

```
Pros:
- Easy to use
- Real-time by default
- Good documentation

Cons:
- Firestore pricing can spike
- Limited free tier (1GB storage, 50K reads/day)
- Vendor lock-in (Google)
- Less flexible querying
```

**Verdict:** Good but limited free tier, pricing unpredictable at scale

### Option C: Supabase Only (No AWS)

```
Pros:
- Simplest setup
- Everything in one place
- Great DX

Cons:
- Edge Functions still beta
- Less mature than AWS Lambda
- Fewer integrations
```

**Verdict:** Good for MVP, but AWS Lambda more mature for production

### Option D: Netlify Functions + MongoDB Atlas

```
Pros:
- Netlify Functions easy to deploy
- MongoDB flexible schema

Cons:
- MongoDB Atlas free tier limited (512MB)
- Netlify Functions limited (125K requests/month)
- No built-in auth
```

**Verdict:** Too limited for our needs

---

## 4. Cost Analysis & Scaling

### Free Tier Capacity

**Supabase Free Tier:**
- 500MB database
- 1GB file storage
- 2GB bandwidth/month
- Unlimited API requests
- **Supports:** ~50,000 resumes, ~10,000 users

**AWS Free Tier (12 months):**
- Lambda: 1M requests/month
- API Gateway: 1M requests/month
- CloudWatch: 5GB logs
- **Supports:** ~30 requests/minute sustained

**Estimated User Capacity:**
- 10,000 registered users
- 50,000 resume versions
- 100,000 API requests/month
- **Cost:** $0/month

### When You'll Need to Pay

**Supabase Paid Tier ($25/month):**
- Triggers at: 8GB database OR 100GB bandwidth
- Approximately: 100,000+ users
- Includes: 8GB DB, 100GB bandwidth, daily backups

**AWS Costs After Free Tier:**
- Lambda: $0.20 per 1M requests
- API Gateway: $3.50 per 1M requests
- At 5M requests/month: ~$20/month

**Total Cost at 100K Users:**
- Supabase: $25/month
- AWS: $20/month
- Stripe fees: ~3% of revenue
- **Total:** ~$45/month + transaction fees

---

## 5. Security Architecture

### Authentication Flow

```
1. User signs up/in via Supabase Auth
2. Supabase returns JWT token
3. Frontend stores token in httpOnly cookie
4. All API requests include JWT in Authorization header
5. Lambda validates JWT with Supabase
6. Row Level Security enforces data access
```

### Data Security

**Row Level Security (RLS) Policies:**
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own resumes"
ON resumes FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own resumes"
ON resumes FOR UPDATE
USING (auth.uid() = user_id);
```

**API Security:**
- CORS configured for Vercel domain only
- Rate limiting on API Gateway
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)

**Payment Security:**
- Never store credit card data
- Use Stripe Checkout (PCI compliant)
- Webhook signature verification
- Idempotency keys for payments

---

## 6. Deployment Strategy

### Infrastructure as Code

```yaml
# serverless.yml
service: resume-builder-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_KEY: ${env:SUPABASE_KEY}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}

functions:
  auth:
    handler: src/handlers/auth.handler
    events:
      - http:
          path: /auth/{proxy+}
          method: ANY
  
  resumes:
    handler: src/handlers/resumes.handler
    events:
      - http:
          path: /resumes/{proxy+}
          method: ANY
```

### CI/CD Pipeline

```
GitHub → GitHub Actions → Deploy to AWS Lambda
                       → Run Tests
                       → Update Supabase Migrations
```

### Environment Management

- **Development:** Local Supabase + LocalStack
- **Staging:** Separate Supabase project + AWS account
- **Production:** Production Supabase + AWS account

---

## 7. Monitoring & Observability

### Logging

- CloudWatch Logs for Lambda functions
- Supabase Dashboard for database queries
- Structured logging with Winston

### Metrics

- API Gateway metrics (requests, latency, errors)
- Lambda metrics (invocations, duration, errors)
- Supabase metrics (connections, query performance)

### Alerting

- CloudWatch Alarms for error rates
- Supabase alerts for database size
- Stripe webhooks for payment failures

### Error Tracking

- Sentry for error tracking (free tier: 5K errors/month)
- Custom error logging to CloudWatch

---

## 8. Development Workflow

### Local Development

```bash
# Start Supabase locally
supabase start

# Start serverless offline
serverless offline

# Run frontend
cd ../resumeBuilderFrontend
npm run dev
```

### Testing Strategy

- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Playwright (frontend)
- Load testing: Artillery

### Code Quality

- TypeScript strict mode
- ESLint + Prettier
- Husky pre-commit hooks
- GitHub Actions CI

---

## 9. Migration Path

### Phase 1: MVP (Free Tier)
- Supabase + AWS Lambda
- Basic features
- 0-10K users

### Phase 2: Growth ($25-50/month)
- Upgrade Supabase to Pro
- Add Redis caching
- 10K-100K users

### Phase 3: Scale ($200-500/month)
- Dedicated PostgreSQL (RDS)
- Multiple Lambda regions
- CDN for assets
- 100K-1M users

### Phase 4: Enterprise ($1000+/month)
- Kubernetes cluster
- Dedicated infrastructure
- Multi-region deployment
- 1M+ users

---

## 10. Recommendation Summary

**Use the Hybrid Architecture (Supabase + AWS Lambda) because:**

1. ✅ **$0 cost for MVP** - Generous free tiers
2. ✅ **Best developer experience** - PostgreSQL + TypeScript
3. ✅ **Production-ready** - Battle-tested technologies
4. ✅ **Scalable** - Grows with your user base
5. ✅ **Feature-rich** - Auth, storage, real-time included
6. ✅ **Secure** - Row Level Security, JWT, HTTPS
7. ✅ **Easy to maintain** - Less code, more features
8. ✅ **Clear migration path** - Can scale to millions of users

**Start building with confidence!** This architecture will serve you from MVP to 100K+ users without breaking the bank.

---

## Next Steps

1. Set up Supabase project
2. Configure AWS account
3. Install Serverless Framework
4. Create database schema
5. Implement authentication
6. Build API endpoints
7. Deploy to production

See `task_list.md` for detailed implementation steps.

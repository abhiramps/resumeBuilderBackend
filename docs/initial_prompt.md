# Resume Builder Backend - Initial Project Prompt

## Project Overview

We are building a **serverless backend** for an ATS-Friendly Resume Builder web application. The backend supports user authentication, resume storage with version control, subscription management, payment processing, and admin capabilities—all using free-tier infrastructure.

## Core Requirements

### 1. Primary Functionality
- **User Authentication**: Email/password + OAuth (Google, GitHub)
- **Resume Management**: CRUD operations with version control
- **Template System**: Multiple resume templates with premium options
- **Subscription Management**: Free, Pro, and Enterprise tiers
- **Payment Processing**: Stripe integration for subscriptions
- **Admin Panel**: User, subscription, and content management
- **Feature Access Control**: Tier-based feature gating

### 2. Technical Stack

**Backend Framework:**
- Node.js 18+ with TypeScript
- Serverless Framework for AWS Lambda deployment
- Express.js for Lambda handlers

**Database:**
- Supabase (PostgreSQL with 500MB free tier)
- JSONB for flexible resume storage
- Row Level Security (RLS) for multi-tenancy

**Authentication:**
- Supabase Auth (built-in JWT)
- OAuth providers (Google, GitHub)
- Session management with refresh tokens

**API Layer:**
- AWS API Gateway (REST API)
- Lambda functions (serverless)
- CloudWatch Logs

**Payment Processing:**
- Stripe for subscriptions
- Webhook handling for events
- Invoice generation

**Hosting:**
- AWS Lambda (1M requests/month free)
- API Gateway (1M requests/month free)
- Frontend on Vercel (already deployed)

### 3. Architecture

```
Frontend (Vercel) → API Gateway → Lambda Functions → Supabase (PostgreSQL)
                                                   ↓
                                              Stripe (Payments)
```

**Why This Stack:**
- ✅ $0 cost for MVP (free tiers)
- ✅ Scales automatically
- ✅ PostgreSQL for complex queries
- ✅ Built-in authentication
- ✅ TypeScript throughout
- ✅ Easy to maintain

### 4. Project Structure

```
resumeBuilderBackend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── auth.ts
│   │   ├── resumes.ts
│   │   ├── subscriptions.ts
│   │   ├── payments.ts
│   │   └── admin.ts
│   ├── services/          # Business logic
│   │   ├── auth.service.ts
│   │   ├── resume.service.ts
│   │   ├── subscription.service.ts
│   │   ├── payment.service.ts
│   │   └── stripe.service.ts
│   ├── models/            # Database models
│   │   ├── user.model.ts
│   │   ├── resume.model.ts
│   │   └── subscription.model.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/             # Utility functions
│   │   ├── supabase.ts
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   ├── types/             # TypeScript types
│   │   ├── user.types.ts
│   │   ├── resume.types.ts
│   │   └── api.types.ts
│   └── config/            # Configuration
│       └── index.ts
├── tests/                 # Test files
├── docs/                  # Documentation
├── serverless.yml         # Serverless config
├── tsconfig.json          # TypeScript config
└── package.json
```

### 5. Database Schema Overview

**Core Tables:**
- `users` - User profiles and subscription info
- `resumes` - Resume documents (JSONB content)
- `resume_versions` - Version history
- `templates` - Resume templates
- `subscriptions` - User subscriptions
- `subscription_plans` - Available plans
- `payments` - Payment transactions
- `admin_users` - Admin accounts
- `audit_logs` - System events
- `feature_flags` - Feature toggles

**Key Features:**
- Row Level Security (RLS) for data isolation
- JSONB for flexible resume storage
- Full-text search capabilities
- Efficient indexing
- Audit logging

See `database_schema.md` for complete schema.

### 6. API Endpoints Overview

**Authentication:**
- POST /auth/signup
- POST /auth/signin
- POST /auth/signout
- POST /auth/refresh
- GET /auth/oauth/google
- GET /auth/oauth/github

**User Management:**
- GET /users/me
- PUT /users/me
- DELETE /users/me

**Resume Management:**
- POST /resumes
- GET /resumes
- GET /resumes/:id
- PUT /resumes/:id
- DELETE /resumes/:id
- POST /resumes/:id/versions
- GET /resumes/:id/versions

**Templates:**
- GET /templates
- GET /templates/:id

**Subscriptions:**
- GET /subscriptions/plans
- POST /subscriptions/checkout
- POST /subscriptions/cancel
- GET /subscriptions/current

**Payments:**
- GET /payments/history
- POST /webhooks/stripe

**Admin:**
- GET /admin/users
- GET /admin/subscriptions
- GET /admin/analytics

### 7. Subscription Plans

**Free Tier:**
- 3 resumes max
- 10 exports/month
- Basic templates only
- Community support

**Pro Tier ($9.99/month):**
- 20 resumes max
- 100 exports/month
- All premium templates
- Custom branding
- Priority support
- Analytics

**Enterprise Tier ($29.99/month):**
- Unlimited resumes
- Unlimited exports
- All features
- API access
- White label
- Dedicated support

### 8. Security Requirements

**Authentication:**
- JWT tokens with expiration
- Refresh token rotation
- OAuth 2.0 for social login
- Password hashing (bcrypt)

**Authorization:**
- Row Level Security (RLS)
- Role-based access control (RBAC)
- API key validation
- Rate limiting

**Data Protection:**
- HTTPS only
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

**Payment Security:**
- Never store credit cards
- Stripe Checkout (PCI compliant)
- Webhook signature verification
- Idempotency keys

### 9. Development Workflow

**Local Development:**
```bash
# Install dependencies
npm install

# Start Supabase locally
supabase start

# Start serverless offline
serverless offline

# Run tests
npm test

# Deploy to staging
serverless deploy --stage staging

# Deploy to production
serverless deploy --stage production
```

**Environment Variables:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=xxx
AWS_REGION=us-east-1
NODE_ENV=development
```

### 10. Testing Strategy

**Unit Tests:**
- Test services in isolation
- Mock external dependencies
- 80%+ code coverage

**Integration Tests:**
- Test API endpoints
- Test database operations
- Test Stripe webhooks

**E2E Tests:**
- Test complete user flows
- Test payment flows
- Test admin operations

**Tools:**
- Jest for unit tests
- Supertest for API tests
- Stripe CLI for webhook testing

### 11. Error Handling

**Error Types:**
- ValidationError (400)
- UnauthorizedError (401)
- ForbiddenError (403)
- NotFoundError (404)
- ConflictError (409)
- InternalServerError (500)

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

**Logging:**
- Structured logging with Winston
- CloudWatch Logs integration
- Error tracking with Sentry
- Request/response logging

### 12. Performance Requirements

**Response Times:**
- Authentication: < 500ms
- Resume CRUD: < 300ms
- List operations: < 500ms
- Search: < 1s

**Scalability:**
- Handle 1M requests/month (free tier)
- Support 10,000 users initially
- Auto-scale with Lambda
- Database connection pooling

**Optimization:**
- Caching with Redis (future)
- Database query optimization
- Lambda cold start mitigation
- Efficient JSONB queries

### 13. Monitoring & Observability

**Metrics:**
- API request count
- Response times
- Error rates
- Lambda invocations
- Database connections

**Alerts:**
- Error rate > 5%
- Response time > 2s
- Database size > 400MB
- Failed payments

**Dashboards:**
- CloudWatch dashboard
- Supabase dashboard
- Stripe dashboard

### 14. Deployment Strategy

**Environments:**
- Development (local)
- Staging (AWS)
- Production (AWS)

**CI/CD:**
- GitHub Actions
- Automated tests
- Automated deployment
- Database migrations

**Rollback:**
- Lambda versioning
- Database backups
- Feature flags for quick disable

### 15. Cost Management

**Free Tier Limits:**
- Supabase: 500MB DB, 1GB storage
- Lambda: 1M requests/month
- API Gateway: 1M requests/month

**Monitoring:**
- Track usage daily
- Alert at 80% of limits
- Optimize before hitting limits

**Scaling Costs:**
- At 10K users: $0/month
- At 100K users: ~$45/month
- At 1M users: ~$500/month

### 16. Development Principles

**Code Quality:**
- TypeScript strict mode
- ESLint + Prettier
- Meaningful variable names
- Comprehensive comments
- DRY principle

**API Design:**
- RESTful conventions
- Consistent naming
- Proper HTTP status codes
- Versioning strategy
- Pagination for lists

**Database:**
- Normalized schema
- Proper indexes
- Efficient queries
- Connection pooling
- Migration strategy

**Security:**
- Principle of least privilege
- Input validation
- Output sanitization
- Secure defaults
- Regular updates

### 17. Documentation Requirements

**Code Documentation:**
- JSDoc comments
- Type definitions
- README files
- Architecture diagrams

**API Documentation:**
- OpenAPI/Swagger spec
- Request/response examples
- Authentication guide
- Error codes reference

**Deployment Documentation:**
- Setup instructions
- Environment variables
- Deployment steps
- Troubleshooting guide

### 18. Success Criteria

The backend is complete when:
- ✅ All 35 tasks completed
- ✅ User authentication working (email + OAuth)
- ✅ Resume CRUD with version control
- ✅ Stripe subscriptions functional
- ✅ Feature access control enforced
- ✅ Admin panel operational
- ✅ 80%+ test coverage
- ✅ API documentation complete
- ✅ Deployed to production
- ✅ Monitoring configured

### 19. Integration with Frontend

**Frontend Repository:** `/Users/admin/Documents/others/resume/resumeBuilder/resumeBuilderFrontend`

**API Base URL:**
- Development: http://localhost:3000
- Production: https://api.resumebuilder.com

**Authentication Flow:**
1. Frontend calls /auth/signin
2. Backend returns JWT token
3. Frontend stores in httpOnly cookie
4. Frontend includes token in Authorization header
5. Backend validates token on each request

**CORS Configuration:**
- Allow origin: https://resumebuilder.vercel.app
- Allow credentials: true
- Allow methods: GET, POST, PUT, DELETE
- Allow headers: Authorization, Content-Type

### 20. Next Steps

After reviewing this document:

1. Set up Supabase project
2. Configure AWS account
3. Initialize project structure
4. Create database schema
5. Implement authentication
6. Build resume endpoints
7. Integrate Stripe
8. Create admin panel
9. Write tests
10. Deploy to production

**Ready to begin? Start with Task 1: Project Initialization**

See `task_list.md` for detailed step-by-step implementation guide.

---

## Quick Start Commands

```bash
# Clone repository
cd /Users/admin/Documents/others/resume/resumeBuilder/resumeBuilderBackend

# Initialize project
npm init -y
npm install --save-dev typescript @types/node serverless

# Install dependencies
npm install express @supabase/supabase-js stripe dotenv

# Initialize TypeScript
npx tsc --init

# Create Serverless config
touch serverless.yml

# Start development
npm run dev
```

---

## Important Notes

- Frontend is at Task 35 (nearly complete)
- Backend starts from scratch
- Use same design patterns as frontend
- Maintain consistency in naming
- Follow TypeScript best practices
- Test thoroughly before deployment
- Document as you build
- Keep security top priority

**Let's build a production-ready backend! 🚀**

# Quick Start Guide - Resume Builder Backend

## 🎯 Goal

Build a production-ready serverless backend for the Resume Builder app in 4-6 weeks using the task-based approach.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 22.x LTS installed (latest stable)
- [ ] npm 10.x or yarn 4.x installed
- [ ] Git installed
- [ ] AWS account created
- [ ] AWS CLI configured
- [ ] Supabase account created
- [ ] Stripe account created
- [ ] Code editor (VS Code recommended)

## 🚀 Quick Setup (15 minutes)

### Step 1: Initialize Project (5 min)

```bash
cd /Users/admin/Documents/others/resume/resumeBuilder/resumeBuilderBackend

# Initialize npm
npm init -y

# Install core dependencies
npm install express @supabase/supabase-js stripe dotenv cors helmet

# Install dev dependencies
npm install --save-dev typescript @types/node @types/express serverless serverless-offline ts-node nodemon eslint prettier jest
```

### Step 2: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Copy Project URL and API keys
5. Save to `.env` file

### Step 3: Create Stripe Account (5 min)

1. Go to [stripe.com](https://stripe.com)
2. Sign up for account
3. Go to Developers > API keys
4. Copy Secret key
5. Save to `.env` file

## 📁 Create Basic Structure

```bash
mkdir -p src/{handlers,services,models,middleware,utils,types,config}
mkdir -p tests/{unit,integration}
mkdir -p docs/prompts
```

## 🔧 Configuration Files

### Create `.env`

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=your_random_secret_key
FRONTEND_URL=http://localhost:5173
AWS_REGION=us-east-1
NODE_ENV=development
```

### Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Create `serverless.yml`

```yaml
service: resume-builder-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  api:
    handler: src/handlers/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
```

## 📚 Development Workflow

### Daily Workflow

1. **Morning:** Review current task in `docs/task_list.md`
2. **Read:** Task-specific prompt in `docs/prompts/`
3. **Code:** Implement feature following the guide
4. **Test:** Write and run tests
5. **Commit:** Push changes with descriptive message
6. **Evening:** Update progress, plan next task

### Task Completion Checklist

For each task:
- [ ] Read task description
- [ ] Read task-specific prompt
- [ ] Implement feature
- [ ] Write tests
- [ ] Run tests locally
- [ ] Test manually with Postman/curl
- [ ] Commit changes
- [ ] Update task list progress
- [ ] Move to next task

## 🎓 Learning Path

### Week 1: Foundation (Tasks 1-5)
- Project setup
- Supabase configuration
- TypeScript types
- AWS setup
- Environment management

**Goal:** Have a working local server with health check endpoint

### Week 2: Authentication (Tasks 6-10)
- Supabase Auth integration
- JWT middleware
- OAuth (Google, GitHub)
- User profile management
- Session management

**Goal:** Complete authentication system with tests

### Week 3: Resume Management (Tasks 11-15)
- Resume CRUD operations
- Version control
- Search and filtering
- Public sharing
- Import/Export

**Goal:** Full resume management system

### Week 4: Subscriptions (Tasks 16-23)
- Template management
- Stripe integration
- Subscription lifecycle
- Payment processing
- Webhook handling

**Goal:** Working payment system

### Week 5: Admin & Features (Tasks 24-30)
- Feature flags
- Usage limits
- Admin authentication
- User management
- Analytics

**Goal:** Complete admin panel

### Week 6: Testing & Deploy (Tasks 31-35)
- Unit tests
- Integration tests
- Error handling
- API documentation
- Production deployment

**Goal:** Production-ready backend

## 🧪 Testing Strategy

### Test Each Feature

```bash
# Run tests
npm test

# Test specific file
npm test -- auth.test.ts

# Test with coverage
npm test:coverage
```

### Manual Testing

```bash
# Start local server
npm run dev

# Test health endpoint
curl http://localhost:3000/health

# Test signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Test signin
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Progress Tracking

### Update Task List

After completing each task, update `docs/task_list.md`:

```markdown
**Current Progress:** Task 5 (Environment Setup Complete)
```

### Git Commits

Use descriptive commit messages:

```bash
git commit -m "feat: implement user authentication (Task 6)"
git commit -m "test: add auth service tests (Task 6)"
git commit -m "fix: resolve JWT validation issue (Task 7)"
```

## 🐛 Common Issues & Solutions

### Issue: Supabase Connection Error

```
Error: Invalid Supabase URL or Key
```

**Solution:**
1. Check `.env` file exists
2. Verify SUPABASE_URL and SUPABASE_KEY
3. Ensure no trailing slashes in URL

### Issue: Stripe Webhook Verification Failed

```
Error: Webhook signature verification failed
```

**Solution:**
1. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/webhooks/stripe`
2. Copy webhook secret from CLI output
3. Update STRIPE_WEBHOOK_SECRET in `.env`

### Issue: TypeScript Compilation Errors

```
Error: Cannot find module '@types/express'
```

**Solution:**
```bash
npm install --save-dev @types/express @types/node
```

### Issue: Lambda Cold Start Timeout

```
Error: Task timed out after 30.00 seconds
```

**Solution:**
1. Increase timeout in `serverless.yml`:
```yaml
provider:
  timeout: 60
```
2. Optimize code to reduce cold start time

## 📖 Key Resources

### Documentation
- [Architecture Recommendation](architecture_recommendation.md)
- [Database Schema](database_schema.md)
- [Task List](task_list.md)
- [Initial Prompt](initial_prompt.md)

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Serverless Framework](https://www.serverless.com/framework/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎯 Success Metrics

### Week 1
- [ ] Local server running
- [ ] Health check working
- [ ] Database connected

### Week 2
- [ ] User signup/signin working
- [ ] JWT authentication working
- [ ] OAuth providers integrated

### Week 3
- [ ] Resume CRUD complete
- [ ] Version control working
- [ ] Search functional

### Week 4
- [ ] Stripe checkout working
- [ ] Subscriptions created
- [ ] Webhooks handling events

### Week 5
- [ ] Admin panel functional
- [ ] Feature flags working
- [ ] Usage limits enforced

### Week 6
- [ ] All tests passing (80%+ coverage)
- [ ] API documented
- [ ] Deployed to production

## 💡 Pro Tips

1. **Start Simple:** Don't over-engineer. Follow the task list sequentially.

2. **Test Early:** Write tests as you build, not after.

3. **Use Postman:** Create a Postman collection for manual testing.

4. **Read Logs:** CloudWatch logs are your friend for debugging.

5. **Ask for Help:** If stuck for >30 minutes, review docs or ask for help.

6. **Commit Often:** Small, frequent commits are better than large ones.

7. **Document Decisions:** Add comments explaining "why", not just "what".

8. **Monitor Costs:** Check AWS and Supabase usage daily.

9. **Security First:** Never commit `.env` file or API keys.

10. **Stay Organized:** Keep task list updated and track progress.

## 🚀 Ready to Start?

1. ✅ Complete prerequisites checklist
2. ✅ Run quick setup
3. ✅ Create configuration files
4. ✅ Read Task 1 in detail
5. ✅ Start coding!

**Next Step:** Open `docs/prompts/01_project_setup.md` and begin Task 1!

---

**Remember:** Building a production backend takes time. Follow the task list, test thoroughly, and don't skip steps. You've got this! 💪

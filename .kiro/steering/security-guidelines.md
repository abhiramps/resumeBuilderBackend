---
inclusion: always
---

# Security Guidelines - Backend

## Security is Non-Negotiable

Every endpoint, every database query, every user interaction must be secure. This application handles sensitive user data, payment information, and authentication tokens.

## Authentication & Authorization

### Always Authenticate Protected Routes

```typescript
// ✅ Good: Protected route
router.get('/resumes', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resumes = await resumeService.list(req.user!.id);
    res.json(resumes);
  } catch (error) {
    next(error);
  }
});

// ❌ Bad: Unprotected route
router.get('/resumes', async (req, res) => {
  const resumes = await resumeService.list(req.query.userId);
  res.json(resumes);
});
```

### Verify Resource Ownership

```typescript
// ✅ Good: Check ownership
export class ResumeService {
  async getById(resumeId: string, userId: string): Promise<Resume> {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId, // Ensure user owns this resume
        deletedAt: null,
      },
    });
    
    if (!resume) {
      throw new NotFoundError('Resume not found');
    }
    
    return resume;
  }
}

// ❌ Bad: No ownership check
export class ResumeService {
  async getById(resumeId: string): Promise<Resume> {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });
    return resume;
  }
}
```

### Use Row Level Security (RLS)

```sql
-- ✅ Good: RLS policies in Supabase
CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);
```

## Input Validation

### Validate All Inputs

```typescript
// ✅ Good: Joi validation
import Joi from 'joi';

export const createResumeSchema = Joi.object({
  title: Joi.string().required().min(1).max(255).trim(),
  templateId: Joi.string().required().valid('classic', 'modern', 'minimal', 'abhiram'),
  content: Joi.object({
    personalInfo: Joi.object().required(),
    sections: Joi.array().required(),
    layout: Joi.object().required(),
  }).required(),
});

router.post('/resumes', authenticate, validateRequest(createResumeSchema), handler);

// ❌ Bad: No validation
router.post('/resumes', authenticate, async (req, res) => {
  const resume = await resumeService.create(req.user!.id, req.body);
  res.json(resume);
});
```

### Sanitize User Input

```typescript
// ✅ Good: Sanitize HTML/special characters
import validator from 'validator';

const sanitizeInput = (input: string): string => {
  return validator.escape(input.trim());
};

const createResume = async (data: CreateResumeData) => {
  const sanitizedData = {
    ...data,
    title: sanitizeInput(data.title),
  };
  // Process sanitized data
};

// ❌ Bad: Use raw input
const createResume = async (data: CreateResumeData) => {
  // Directly use data.title without sanitization
};
```

### Validate File Uploads

```typescript
// ✅ Good: Validate file type and size
const validateFileUpload = (file: Express.Multer.File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new ValidationError('File too large');
  }
};
```

## SQL Injection Prevention

### Use Prisma (Parameterized Queries)

```typescript
// ✅ Good: Prisma handles parameterization
const user = await prisma.user.findUnique({
  where: { email: userEmail }, // Safe
});

// ❌ Bad: Raw SQL with string interpolation
const user = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userEmail}'` // SQL injection risk!
);

// ✅ Good: If you must use raw SQL, use parameters
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`; // Safe with tagged template
```

## Password Security

### Never Store Plain Passwords

```typescript
// ✅ Good: Supabase Auth handles password hashing
// We don't store passwords ourselves

// If you must hash passwords:
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// ❌ Bad: Store plain passwords
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'password123', // NEVER DO THIS!
  },
});
```

## JWT Security

### Validate JWT Tokens

```typescript
// ✅ Good: Verify JWT with Supabase
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    
    req.user = { id: user.id, email: user.email! };
    next();
  } catch (error) {
    next(error);
  }
};

// ❌ Bad: Trust token without verification
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.decode(token); // No verification!
  req.user = decoded;
  next();
};
```

### Use Short-Lived Tokens

```typescript
// ✅ Good: Short expiration
const config = {
  jwt: {
    expiresIn: '7d', // 7 days max
    refreshExpiresIn: '30d',
  },
};

// ❌ Bad: Long-lived tokens
const config = {
  jwt: {
    expiresIn: '365d', // Too long!
  },
};
```

## Stripe Security

### Verify Webhook Signatures

```typescript
// ✅ Good: Verify Stripe webhook signature
import Stripe from 'stripe';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Process verified event
    await handleStripeEvent(event);
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).send('Webhook signature verification failed');
  }
};

// ❌ Bad: Process without verification
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body; // Not verified!
  await handleStripeEvent(event);
  res.json({ received: true });
};
```

### Never Store Credit Card Data

```typescript
// ✅ Good: Use Stripe Checkout
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${FRONTEND_URL}/success`,
  cancel_url: `${FRONTEND_URL}/cancel`,
});

// ❌ Bad: Handle credit card data directly
// NEVER DO THIS - PCI compliance nightmare
const payment = await processPayment({
  cardNumber: req.body.cardNumber,
  cvv: req.body.cvv,
  expiry: req.body.expiry,
});
```

## Rate Limiting

### Implement Rate Limiting

```typescript
// ✅ Good: Rate limit sensitive endpoints
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
});

router.post('/auth/signin', authLimiter, signinHandler);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
});

router.use('/api', apiLimiter);
```

## CORS Configuration

### Configure CORS Properly

```typescript
// ✅ Good: Specific origin
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://resumebuilder.vercel.app'
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};

app.use(cors(corsOptions));

// ❌ Bad: Allow all origins
app.use(cors({ origin: '*' })); // Security risk!
```

## Environment Variables

### Never Commit Secrets

```typescript
// ✅ Good: Use environment variables
const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
};

// ❌ Bad: Hardcode secrets
const config = {
  stripe: {
    secretKey: 'sk_live_abc123...', // NEVER DO THIS!
  },
};
```

### Validate Environment Variables

```typescript
// ✅ Good: Validate on startup
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'STRIPE_SECRET_KEY',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Error Handling

### Don't Expose Sensitive Information

```typescript
// ✅ Good: Generic error messages
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
  
  // Log full error internally
  logger.error('Unexpected error:', error);
  
  // Return generic message to client
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

// ❌ Bad: Expose stack traces
export const errorHandler = (error: Error, req: Request, res: Response) => {
  res.status(500).json({
    error: error.message,
    stack: error.stack, // Exposes internal details!
  });
};
```

## Logging

### Log Security Events

```typescript
// ✅ Good: Log security-relevant events
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

logger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  reason: 'Invalid password',
});

logger.error('Unauthorized access attempt', {
  userId: req.user?.id,
  resource: req.path,
  ip: req.ip,
});
```

### Don't Log Sensitive Data

```typescript
// ✅ Good: Redact sensitive data
logger.info('Payment processed', {
  userId: user.id,
  amount: payment.amount,
  last4: payment.card.last4, // Only last 4 digits
});

// ❌ Bad: Log sensitive data
logger.info('Payment processed', {
  userId: user.id,
  cardNumber: payment.cardNumber, // NEVER LOG THIS!
  cvv: payment.cvv, // NEVER LOG THIS!
});
```

## Database Security

### Use Parameterized Queries

```typescript
// ✅ Good: Prisma handles this automatically
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: searchTerm, // Safe
    },
  },
});
```

### Implement Soft Deletes

```typescript
// ✅ Good: Soft delete for audit trail
const deleteResume = async (resumeId: string, userId: string) => {
  await prisma.resume.update({
    where: { id: resumeId },
    data: { deletedAt: new Date() },
  });
};

// Query excluding soft-deleted
const resumes = await prisma.resume.findMany({
  where: {
    userId,
    deletedAt: null,
  },
});
```

## API Security Checklist

Before deploying any endpoint:

- [ ] Authentication required?
- [ ] Authorization checked (user owns resource)?
- [ ] Input validated?
- [ ] Output sanitized?
- [ ] Rate limiting applied?
- [ ] Error handling implemented?
- [ ] Logging added?
- [ ] CORS configured?
- [ ] HTTPS only?
- [ ] Secrets in environment variables?

## Security Testing

### Test Authentication

```typescript
describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const response = await request(app).get('/resumes');
    expect(response.status).toBe(401);
  });
  
  it('should reject requests with invalid token', async () => {
    const response = await request(app)
      .get('/resumes')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });
});
```

### Test Authorization

```typescript
describe('Authorization', () => {
  it('should not allow access to other users resumes', async () => {
    const response = await request(app)
      .get(`/resumes/${otherUserResumeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(404); // Not found (not unauthorized to avoid info leak)
  });
});
```

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Stripe Security](https://stripe.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

## Remember

**Security Principles:**
1. **Never trust user input** - Validate everything
2. **Principle of least privilege** - Give minimum necessary access
3. **Defense in depth** - Multiple layers of security
4. **Fail securely** - Default to deny access
5. **Keep secrets secret** - Never commit credentials
6. **Log security events** - But not sensitive data
7. **Update dependencies** - Patch security vulnerabilities
8. **Test security** - Include security tests

**When in doubt, deny access and log the attempt.**

Security is not optional. Every line of code must consider security implications.

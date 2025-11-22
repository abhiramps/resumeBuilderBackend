# Frontend-Backend Integration Guide

## Overview

This document outlines how the Resume Builder frontend (React on Vercel) integrates with the backend (Node.js on AWS Lambda).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                        │
│                  React + TypeScript                         │
│                                                             │
│  Components:                                                │
│  - Resume Editor                                            │
│  - Template Selector                                        │
│  - Layout Controls                                          │
│  - Preview                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │ JWT Authentication
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 BACKEND (AWS Lambda)                        │
│              Node.js + TypeScript + Express                 │
│                                                             │
│  Services:                                                  │
│  - Authentication (Supabase Auth)                           │
│  - Resume Management                                        │
│  - Subscription Management (Stripe)                         │
│  - Template Management                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)                 │
│                                                             │
│  Tables:                                                    │
│  - users, resumes, subscriptions, payments                  │
└─────────────────────────────────────────────────────────────┘
```

## API Integration

### Base URLs

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3000`

**Production:**
- Frontend: `https://resumebuilder.vercel.app`
- Backend: `https://api.resumebuilder.com`

### Authentication Flow

```typescript
// Frontend: Sign up
const response = await fetch('http://localhost:3000/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    fullName: 'John Doe'
  })
});

const { user, session } = await response.json();

// Store token
localStorage.setItem('access_token', session.access_token);
localStorage.setItem('refresh_token', session.refresh_token);

// Use token in subsequent requests
const resumeResponse = await fetch('http://localhost:3000/resumes', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

## Data Flow Examples

### 1. Creating a Resume

**Frontend (Task 35 complete):**
```typescript
// src/contexts/ResumeContext.tsx
const createResume = async (resumeData: Resume) => {
  const response = await fetch(`${API_BASE_URL}/resumes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: resumeData.title,
      template_id: resumeData.template,
      content: {
        personalInfo: resumeData.personalInfo,
        sections: resumeData.sections,
        layout: resumeData.layout
      }
    })
  });
  
  return await response.json();
};
```

**Backend (Task 11):**
```typescript
// src/handlers/resumes.ts
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.create(req.user!.id, req.body);
    res.status(201).json(resume);
  } catch (error) {
    next(error);
  }
});

// src/services/resume.service.ts
async create(userId: string, data: CreateResumeData): Promise<Resume> {
  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title: data.title,
      template_id: data.template_id,
      content: data.content,
      status: 'draft'
    })
    .select()
    .single();
  
  return resume;
}
```

### 2. Updating Resume (Auto-save)

**Frontend:**
```typescript
// src/hooks/useAutoSave.ts
useEffect(() => {
  const timer = setTimeout(async () => {
    await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: resumeState,
        updated_at: new Date().toISOString()
      })
    });
  }, 30000); // Auto-save every 30 seconds
  
  return () => clearTimeout(timer);
}, [resumeState]);
```

**Backend:**
```typescript
// src/handlers/resumes.ts
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.update(
      req.params.id,
      req.user!.id,
      req.body
    );
    res.json(resume);
  } catch (error) {
    next(error);
  }
});
```

### 3. Subscription Check

**Frontend:**
```typescript
// Before creating resume, check limits
const checkResumeLimit = async () => {
  const response = await fetch(
    `${API_BASE_URL}/subscriptions/limits/max_resumes`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const { allowed, current, limit } = await response.json();
  
  if (!allowed) {
    showUpgradeModal();
    return false;
  }
  
  return true;
};
```

**Backend:**
```typescript
// src/services/subscription.service.ts
async checkUsageLimit(userId: string, limitType: string) {
  const subscription = await this.getUserSubscription(userId);
  const plan = subscription?.plan || await this.getPlanById('free');
  
  const limit = plan.features[limitType];
  
  const { count } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  
  const allowed = limit === -1 || count < limit;
  
  return { allowed, current: count, limit };
}
```

## Type Definitions Alignment

### Frontend Types (src/types/resume.types.ts)

```typescript
interface Resume {
  id: string;
  personalInfo: PersonalInfo;
  sections: Section[];
  layout: LayoutSettings;
  template: TemplateType;
}

interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}
```

### Backend Types (src/types/resume.types.ts)

```typescript
interface Resume {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  content: {
    personalInfo: PersonalInfo;
    sections: Section[];
    layout: LayoutSettings;
  };
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}
```

### Mapping Strategy

Frontend stores resume data in a flat structure for easy editing. Backend stores it in JSONB for flexibility.

**Frontend → Backend:**
```typescript
const backendPayload = {
  title: resume.personalInfo.fullName + "'s Resume",
  template_id: resume.template,
  content: {
    personalInfo: resume.personalInfo,
    sections: resume.sections,
    layout: resume.layout
  }
};
```

**Backend → Frontend:**
```typescript
const frontendResume = {
  id: backendResume.id,
  personalInfo: backendResume.content.personalInfo,
  sections: backendResume.content.sections,
  layout: backendResume.content.layout,
  template: backendResume.template_id
};
```

## Feature Parity

### Frontend Features (Task 35 Complete)

| Feature | Status | Backend Task |
|---------|--------|--------------|
| User Authentication | ✅ Complete | Task 6-10 |
| Resume CRUD | ✅ Complete | Task 11 |
| Template Selection | ✅ Complete | Task 16-18 |
| Layout Customization | ✅ Complete | Task 11 (content) |
| Auto-save | ✅ Complete | Task 11 (update) |
| Version History | ⏳ Pending | Task 12 |
| PDF Export | ✅ Complete | Frontend only |
| JSON Import/Export | ✅ Complete | Task 15 |
| Public Sharing | ⏳ Pending | Task 14 |
| ATS Validation | ✅ Complete | Frontend only |

### Backend Features (To Implement)

| Feature | Task | Status |
|---------|------|--------|
| User Authentication | 6-10 | ⏳ To Do |
| Resume CRUD | 11 | ⏳ To Do |
| Version Control | 12 | ⏳ To Do |
| Search & Filter | 13 | ⏳ To Do |
| Public Sharing | 14 | ⏳ To Do |
| Import/Export | 15 | ⏳ To Do |
| Templates | 16-18 | ⏳ To Do |
| Subscriptions | 19-23 | ⏳ To Do |
| Admin Panel | 27-30 | ⏳ To Do |

## API Endpoints Mapping

### Authentication

| Frontend Action | Backend Endpoint | Method |
|----------------|------------------|--------|
| Sign Up | `/auth/signup` | POST |
| Sign In | `/auth/signin` | POST |
| Sign Out | `/auth/signout` | POST |
| Refresh Token | `/auth/refresh` | POST |
| OAuth Google | `/auth/oauth/google` | GET |
| OAuth GitHub | `/auth/oauth/github` | GET |

### Resume Management

| Frontend Action | Backend Endpoint | Method |
|----------------|------------------|--------|
| Create Resume | `/resumes` | POST |
| List Resumes | `/resumes` | GET |
| Get Resume | `/resumes/:id` | GET |
| Update Resume | `/resumes/:id` | PUT |
| Delete Resume | `/resumes/:id` | DELETE |
| Create Version | `/resumes/:id/versions` | POST |
| List Versions | `/resumes/:id/versions` | GET |
| Export JSON | `/resumes/:id/export` | GET |
| Import JSON | `/resumes/import` | POST |
| Share Resume | `/resumes/:id/share` | POST |
| Get Public | `/public/:slug` | GET |

### Templates

| Frontend Action | Backend Endpoint | Method |
|----------------|------------------|--------|
| List Templates | `/templates` | GET |
| Get Template | `/templates/:id` | GET |

### Subscriptions

| Frontend Action | Backend Endpoint | Method |
|----------------|------------------|--------|
| List Plans | `/subscriptions/plans` | GET |
| Get Current | `/subscriptions/current` | GET |
| Create Checkout | `/subscriptions/checkout` | POST |
| Cancel | `/subscriptions/cancel` | POST |
| Change Plan | `/subscriptions/change-plan` | POST |

## Error Handling

### Frontend Error Handling

```typescript
try {
  const response = await fetch(`${API_BASE_URL}/resumes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resumeData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      // Token expired, refresh
      await refreshToken();
      // Retry request
    } else if (response.status === 403) {
      // Subscription limit reached
      showUpgradeModal();
    } else {
      // Show error message
      showError(error.message);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('Network error:', error);
  showError('Network error. Please try again.');
}
```

### Backend Error Response Format

```typescript
// Success
{
  "id": "uuid",
  "title": "My Resume",
  "created_at": "2024-11-01T00:00:00Z"
}

// Error
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

## CORS Configuration

### Backend CORS Setup

```typescript
// src/handlers/index.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://resumebuilder.vercel.app'
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
};

app.use(cors(corsOptions));
```

## Environment Variables

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Backend (.env)

```env
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

## Testing Integration

### Frontend Integration Test

```typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  it('should create resume via API', async () => {
    const response = await fetch('http://localhost:3000/resumes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Resume',
        template_id: 'modern',
        content: { /* ... */ }
      })
    });
    
    expect(response.status).toBe(201);
    const resume = await response.json();
    expect(resume).toHaveProperty('id');
  });
});
```

### Backend Integration Test

```typescript
// tests/integration/resumes.test.ts
describe('Resume API', () => {
  it('should create resume', async () => {
    const response = await request(app)
      .post('/resumes')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Test Resume',
        template_id: 'modern',
        content: { /* ... */ }
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

## Deployment

### Frontend Deployment (Vercel)

```bash
# Already deployed
# URL: https://resumebuilder.vercel.app
```

### Backend Deployment (AWS Lambda)

```bash
# Deploy to production
npm run deploy:prod

# Update environment variables
serverless deploy --stage prod
```

### Environment Sync

After backend deployment, update frontend environment:

```env
# Frontend .env.production
VITE_API_BASE_URL=https://api.resumebuilder.com
```

## Next Steps

1. **Complete Backend Tasks 1-35** following the task list
2. **Test Integration** after each major feature
3. **Update Frontend** to use backend API instead of localStorage
4. **Deploy Backend** to production
5. **Update Frontend** environment variables
6. **Test End-to-End** in production

## Summary

- Frontend is at **Task 35** (nearly complete)
- Backend starts at **Task 0** (to be built)
- Both use **TypeScript** for type safety
- **REST API** for communication
- **JWT** for authentication
- **Supabase** for database
- **Stripe** for payments

**The frontend is ready. Now let's build the backend! 🚀**

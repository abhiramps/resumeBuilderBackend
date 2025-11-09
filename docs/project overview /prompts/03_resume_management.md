# Tasks 11-15: Resume Management System

## Overview
Implement complete resume CRUD operations with version control, search, sharing, and import/export functionality.

---

## Task 11: Resume CRUD Operations

### Objective
Implement create, read, update, delete operations for resumes.

### Implementation

Create `src/services/resume.service.ts`:

```typescript
import { supabase } from '../utils/supabase';
import { CreateResumeData, UpdateResumeData, Resume } from '../types/resume.types';
import { checkSubscriptionLimits } from '../utils/subscription-limits';

export class ResumeService {
  async create(userId: string, data: CreateResumeData): Promise<Resume> {
    // Check subscription limits
    const canCreate = await checkSubscriptionLimits(userId, 'max_resumes');
    if (!canCreate) {
      throw new Error('Resume limit reached for your subscription tier');
    }
    
    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        title: data.title,
        template_id: data.template_id || 'modern',
        content: data.content,
        status: 'draft',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update user resume count
    await this.updateResumeCount(userId);
    
    return resume;
  }
  
  async getById(resumeId: string, userId: string): Promise<Resume> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async list(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    template?: string;
  } = {}): Promise<{ resumes: Resume[]; total: number }> {
    const { page = 1, limit = 10, status, template } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('resumes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) query = query.eq('status', status);
    if (template) query = query.eq('template_id', template);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      resumes: data || [],
      total: count || 0,
    };
  }
  
  async update(resumeId: string, userId: string, updates: UpdateResumeData): Promise<Resume> {
    const { data, error } = await supabase
      .from('resumes')
      .update(updates)
      .eq('id', resumeId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async delete(resumeId: string, userId: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from('resumes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', resumeId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update user resume count
    await this.updateResumeCount(userId);
  }
  
  private async updateResumeCount(userId: string): Promise<void> {
    const { count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);
    
    await supabase
      .from('users')
      .update({ resume_count: count })
      .eq('id', userId);
  }
}
```

Create `src/handlers/resumes.ts`:

```typescript
import { Router } from 'express';
import { ResumeService } from '../services/resume.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validators';

const router = Router();
const resumeService = new ResumeService();

// Create resume
router.post('/', authenticate, validateRequest(createResumeSchema), async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.create(req.user!.id, req.body);
    res.status(201).json(resume);
  } catch (error) {
    next(error);
  }
});

// List resumes
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, status, template } = req.query;
    const result = await resumeService.list(req.user!.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      template: template as string,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get resume by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.getById(req.params.id, req.user!.id);
    res.json(resume);
  } catch (error) {
    next(error);
  }
});

// Update resume
router.put('/:id', authenticate, validateRequest(updateResumeSchema), async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.update(req.params.id, req.user!.id, req.body);
    res.json(resume);
  } catch (error) {
    next(error);
  }
});

// Delete resume
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await resumeService.delete(req.params.id, req.user!.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Task 12: Resume Version Control

### Objective
Implement version history for resumes.

### Implementation

Create `src/services/version.service.ts`:

```typescript
import { supabase } from '../utils/supabase';
import { ResumeVersion } from '../types/resume.types';

export class VersionService {
  async createVersion(resumeId: string, userId: string, versionName?: string): Promise<ResumeVersion> {
    // Get current resume
    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (!resume) throw new Error('Resume not found');
    
    // Get next version number
    const { count } = await supabase
      .from('resume_versions')
      .select('*', { count: 'exact', head: true })
      .eq('resume_id', resumeId);
    
    const versionNumber = (count || 0) + 1;
    
    // Create version
    const { data: version, error } = await supabase
      .from('resume_versions')
      .insert({
        resume_id: resumeId,
        user_id: userId,
        version_number: versionNumber,
        version_name: versionName || `Version ${versionNumber}`,
        content: resume.content,
        template_id: resume.template_id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return version;
  }
  
  async listVersions(resumeId: string, userId: string): Promise<ResumeVersion[]> {
    const { data, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .order('version_number', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  async restoreVersion(resumeId: string, versionId: string, userId: string): Promise<void> {
    // Get version
    const { data: version } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', userId)
      .single();
    
    if (!version) throw new Error('Version not found');
    
    // Update resume with version content
    const { error } = await supabase
      .from('resumes')
      .update({
        content: version.content,
        template_id: version.template_id,
      })
      .eq('id', resumeId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}
```

---

## Task 13: Resume Search & Filtering

### Objective
Implement full-text search and advanced filtering.

### Implementation

Update `src/services/resume.service.ts`:

```typescript
async search(userId: string, query: string, options: {
  page?: number;
  limit?: number;
}= {}): Promise<{ resumes: Resume[]; total: number }> {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('resumes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .textSearch('fts', query)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  
  return {
    resumes: data || [],
    total: count || 0,
  };
}
```

---

## Task 14: Resume Sharing & Public URLs

### Objective
Implement resume sharing with public URLs.

### Implementation

Update `src/services/resume.service.ts`:

```typescript
async share(resumeId: string, userId: string): Promise<{ slug: string; url: string }> {
  // Generate unique slug
  const slug = `${userId.slice(0, 8)}-${resumeId.slice(0, 8)}-${Date.now()}`;
  
  const { error } = await supabase
    .from('resumes')
    .update({
      is_public: true,
      public_slug: slug,
    })
    .eq('id', resumeId)
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return {
    slug,
    url: `${process.env.FRONTEND_URL}/public/${slug}`,
  };
}

async getPublicResume(slug: string): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single();
  
  if (error) throw error;
  
  // Increment view count
  await supabase
    .from('resumes')
    .update({ view_count: data.view_count + 1 })
    .eq('id', data.id);
  
  return data;
}

async unshare(resumeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .update({
      is_public: false,
      public_slug: null,
    })
    .eq('id', resumeId)
    .eq('user_id', userId);
  
  if (error) throw error;
}
```

---

## Task 15: Resume Import/Export

### Objective
Implement JSON import/export functionality.

### Implementation

Update `src/services/resume.service.ts`:

```typescript
async export(resumeId: string, userId: string): Promise<any> {
  const resume = await this.getById(resumeId, userId);
  
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    resume: {
      title: resume.title,
      template_id: resume.template_id,
      content: resume.content,
    },
  };
}

async import(userId: string, data: any): Promise<Resume> {
  // Validate import data
  if (!data.resume || !data.resume.content) {
    throw new Error('Invalid import data');
  }
  
  return this.create(userId, {
    title: data.resume.title || 'Imported Resume',
    template_id: data.resume.template_id || 'modern',
    content: data.resume.content,
  });
}

async duplicate(resumeId: string, userId: string): Promise<Resume> {
  const original = await this.getById(resumeId, userId);
  
  return this.create(userId, {
    title: `${original.title} (Copy)`,
    template_id: original.template_id,
    content: original.content,
  });
}
```

Update `src/handlers/resumes.ts`:

```typescript
// Export resume
router.get('/:id/export', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = await resumeService.export(req.params.id, req.user!.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Import resume
router.post('/import', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.import(req.user!.id, req.body);
    res.status(201).json(resume);
  } catch (error) {
    next(error);
  }
});

// Duplicate resume
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const resume = await resumeService.duplicate(req.params.id, req.user!.id);
    res.status(201).json(resume);
  } catch (error) {
    next(error);
  }
});

// Share resume
router.post('/:id/share', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await resumeService.share(req.params.id, req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get public resume
router.get('/public/:slug', async (req, res, next) => {
  try {
    const resume = await resumeService.getPublicResume(req.params.slug);
    res.json(resume);
  } catch (error) {
    next(error);
  }
});
```

---

## Testing

Create `tests/integration/resumes.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Resume Management', () => {
  let authToken: string;
  let resumeId: string;
  
  beforeAll(async () => {
    // Sign in and get token
    const response = await request(app)
      .post('/auth/signin')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = response.body.session.access_token;
  });
  
  describe('POST /resumes', () => {
    it('should create a new resume', async () => {
      const response = await request(app)
        .post('/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Resume',
          template_id: 'modern',
          content: { personalInfo: {}, sections: [] },
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      resumeId = response.body.id;
    });
  });
  
  describe('GET /resumes', () => {
    it('should list user resumes', async () => {
      const response = await request(app)
        .get('/resumes')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resumes');
      expect(response.body).toHaveProperty('total');
    });
  });
});
```

---

## Deliverables

✅ Resume CRUD operations
✅ Version control system
✅ Search and filtering
✅ Public sharing with URLs
✅ Import/Export JSON
✅ Duplicate resume
✅ Subscription limit checking
✅ Tests

**Resume Management Complete! Ready for Task 16: Templates**

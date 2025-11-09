# Tasks 6-10: Authentication System

## Overview
Implement complete authentication system using Supabase Auth with JWT tokens, OAuth providers, and session management.

---

## Task 6: Supabase Auth Integration

### Objective
Integrate Supabase authentication for email/password signup and signin.

### Implementation

#### 1. Create Supabase Client

Create `src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.key
);

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);
```

#### 2. Create Auth Service

Create `src/services/auth.service.ts`:

```typescript
import { supabase, supabaseAdmin } from '../utils/supabase';
import { SignUpData, SignInData, AuthResponse } from '../types/auth.types';

export class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const { email, password, fullName } = data;
    
    // Sign up with Supabase
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    
    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
        });
      
      if (profileError) throw profileError;
    }
    
    return {
      user: authData.user,
      session: authData.session,
    };
  }
  
  async signIn(data: SignInData): Promise<AuthResponse> {
    const { email, password } = data;
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);
    
    return {
      user: authData.user,
      session: authData.session,
    };
  }
  
  async signOut(accessToken: string): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    
    if (error) throw error;
  }
  
  async verifyEmail(token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });
    
    if (error) throw error;
  }
}
```

#### 3. Create Auth Handler

Create `src/handlers/auth.ts`:

```typescript
import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middleware/validation.middleware';
import { signUpSchema, signInSchema } from '../validators/auth.validators';

const router = Router();
const authService = new AuthService();

// Sign up
router.post('/signup', validateRequest(signUpSchema), async (req, res, next) => {
  try {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Sign in
router.post('/signin', validateRequest(signInSchema), async (req, res, next) => {
  try {
    const result = await authService.signIn(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Sign out
router.post('/signout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await authService.signOut(token!);
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Task 7: JWT Middleware

### Objective
Create middleware to validate JWT tokens and extract user context.

### Implementation

Create `src/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { UnauthorizedError } from '../utils/errors';

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
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email!,
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
```

---

## Task 8: OAuth Integration

### Objective
Add Google and GitHub OAuth authentication.

### Implementation

Update `src/services/auth.service.ts`:

```typescript
async signInWithOAuth(provider: 'google' | 'github'): Promise<{ url: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
    },
  });
  
  if (error) throw error;
  
  return { url: data.url };
}

async handleOAuthCallback(code: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) throw error;
  
  // Create or update user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata.full_name,
        avatar_url: data.user.user_metadata.avatar_url,
        last_login_at: new Date().toISOString(),
      });
    
    if (profileError) throw profileError;
  }
  
  return {
    user: data.user,
    session: data.session,
  };
}
```

Update `src/handlers/auth.ts`:

```typescript
// OAuth sign in
router.get('/oauth/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await authService.signInWithOAuth(provider as 'google' | 'github');
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// OAuth callback
router.get('/oauth/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const result = await authService.handleOAuthCallback(code as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

---

## Task 9: User Profile Management

### Objective
Implement user profile CRUD operations.

### Implementation

Create `src/services/user.service.ts`:

```typescript
import { supabase } from '../utils/supabase';
import { UpdateUserData, UserProfile } from '../types/user.types';

export class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async updateProfile(userId: string, updates: UpdateUserData): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async deleteAccount(userId: string): Promise<void> {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('users')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  }
  
  async updatePreferences(userId: string, preferences: any): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', userId);
    
    if (error) throw error;
  }
}
```

Create `src/handlers/users.ts`:

```typescript
import { Router } from 'express';
import { UserService } from '../services/user.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const userService = new UserService();

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user!.id, req.body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await userService.deleteAccount(req.user!.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Task 10: Session Management

### Objective
Implement refresh tokens and session management.

### Implementation

Update `src/services/auth.service.ts`:

```typescript
async refreshSession(refreshToken: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });
  
  if (error) throw error;
  
  return {
    user: data.user,
    session: data.session,
  };
}

async getSessions(userId: string): Promise<any[]> {
  // Get active sessions from Supabase
  const { data, error } = await supabaseAdmin.auth.admin.listUserSessions(userId);
  
  if (error) throw error;
  return data;
}

async revokeSession(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteSession(sessionId);
  if (error) throw error;
}
```

Update `src/handlers/auth.ts`:

```typescript
// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshSession(refresh_token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await authService.getSessions(req.user!.id);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Revoke session
router.delete('/sessions/:id', authenticate, async (req, res, next) => {
  try {
    await authService.revokeSession(req.params.id);
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
});
```

---

## Testing

Create `tests/integration/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Authentication', () => {
  describe('POST /auth/signup', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('session');
    });
  });
  
  describe('POST /auth/signin', () => {
    it('should sign in existing user', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
    });
  });
});
```

---

## Deliverables

✅ Supabase Auth integration
✅ Sign up/sign in endpoints
✅ JWT middleware
✅ OAuth (Google, GitHub)
✅ User profile management
✅ Session management
✅ Refresh tokens
✅ Password reset
✅ Email verification
✅ Tests

**Authentication Complete! Ready for Task 11: Resume Management**

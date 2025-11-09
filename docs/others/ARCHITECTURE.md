# Architecture: Supabase Auth + Prisma ORM

## Overview

Our backend uses a **hybrid approach** combining Supabase for authentication and Prisma for database operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                    (Frontend App)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Express Server                           │
│                   (Port 3001)                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                        │  │
│  │  • CORS, Helmet (Security)                          │  │
│  │  • JWT Authentication (Supabase)                    │  │
│  │  • Request Validation (Joi)                         │  │
│  │  • Error Handling                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Route Handlers                          │  │
│  │  • /auth/* - Authentication endpoints               │  │
│  │  • /users/* - User management                       │  │
│  │  • /resumes/* - Resume operations (Phase 3)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                           │  │
│  │  • AuthService - Authentication logic               │  │
│  │  • UserService - User operations                    │  │
│  │  • ResumeService - Resume operations (Phase 3)      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────┬───────────────────┘
                          │               │
                          │               │
        ┌─────────────────▼──┐      ┌────▼──────────────────┐
        │  Supabase Auth     │      │   Prisma ORM          │
        │  (Authentication)  │      │   (Database)          │
        └─────────────────┬──┘      └────┬──────────────────┘
                          │               │
                          │               │
                          └───────┬───────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Supabase PostgreSQL      │
                    │   (Database Storage)       │
                    └────────────────────────────┘
```

## Component Responsibilities

### 1. Supabase Auth (Authentication Only)

**Purpose**: Handle user authentication and JWT token management

**Used For**:
- ✅ User signup (`supabase.auth.signUp()`)
- ✅ User signin (`supabase.auth.signInWithPassword()`)
- ✅ OAuth flows (`supabase.auth.signInWithOAuth()`)
- ✅ JWT token validation (`supabase.auth.getUser()`)
- ✅ Password reset (`supabase.auth.resetPasswordForEmail()`)
- ✅ Session refresh (`supabase.auth.refreshSession()`)
- ✅ Sign out (`supabase.auth.signOut()`)

**NOT Used For**:
- ❌ Database queries
- ❌ User profile storage
- ❌ Application data

**Example**:
```typescript
// ✅ CORRECT: Use Supabase for authentication
const { data: authData, error } = await supabase.auth.signUp({
  email,
  password,
});

// ❌ WRONG: Don't use Supabase for database operations
await supabase.from('users').insert({ ... }); // DON'T DO THIS
```

### 2. Prisma ORM (Database Operations)

**Purpose**: Handle all database CRUD operations

**Used For**:
- ✅ Creating user profiles (`prisma.user.create()`)
- ✅ Updating user data (`prisma.user.update()`)
- ✅ Querying users (`prisma.user.findUnique()`)
- ✅ Resume operations (`prisma.resume.*`)
- ✅ Subscription management (`prisma.subscription.*`)
- ✅ Payment tracking (`prisma.payment.*`)
- ✅ All database transactions

**NOT Used For**:
- ❌ Authentication
- ❌ JWT token generation
- ❌ Password hashing

**Example**:
```typescript
// ✅ CORRECT: Use Prisma for database operations
await prisma.user.create({
  data: {
    id: authData.user.id,
    email: authData.user.email!,
    fullName: fullName,
  },
});

// ❌ WRONG: Don't use Prisma for authentication
await prisma.auth.signIn({ ... }); // This doesn't exist
```

## Authentication Flow

### Sign Up Flow

```
1. Client sends signup request
   POST /auth/signup
   { email, password, fullName }
   
2. AuthService.signUp()
   ├─> Supabase Auth: Create auth user
   │   supabase.auth.signUp()
   │   Returns: { user, session }
   │
   └─> Prisma: Create user profile
       prisma.user.create()
       Stores: id, email, fullName, preferences, etc.
       
3. Return JWT tokens to client
   { user, session }
```

### Sign In Flow

```
1. Client sends signin request
   POST /auth/signin
   { email, password }
   
2. AuthService.signIn()
   ├─> Supabase Auth: Validate credentials
   │   supabase.auth.signInWithPassword()
   │   Returns: { user, session }
   │
   └─> Prisma: Update last login
       prisma.user.update()
       Updates: lastLoginAt
       
3. Return JWT tokens to client
   { user, session }
```

### Protected Route Flow

```
1. Client sends request with JWT
   GET /users/me
   Headers: { Authorization: "Bearer <token>" }
   
2. Auth Middleware
   ├─> Extract token from header
   │
   ├─> Supabase Auth: Validate token
   │   supabase.auth.getUser(token)
   │   Returns: { user } or error
   │
   └─> Attach user to request
       req.user = { id, email }
       
3. Route Handler
   └─> Prisma: Fetch user data
       prisma.user.findUnique()
       Returns: Full user profile
       
4. Return data to client
```

## Data Flow

### User Data Storage

```
┌─────────────────────────────────────────────────────────┐
│                  Supabase Auth                          │
│  (auth.users table - managed by Supabase)              │
│                                                         │
│  Stores:                                               │
│  • id (UUID)                                           │
│  • email                                               │
│  • encrypted_password                                  │
│  • email_confirmed_at                                  │
│  • last_sign_in_at                                     │
│  • user_metadata (JSON)                                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ User ID links both
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Prisma Database (public.users)             │
│  (Our application database - managed by Prisma)        │
│                                                         │
│  Stores:                                               │
│  • id (same UUID from Supabase Auth)                   │
│  • email                                               │
│  • fullName                                            │
│  • avatarUrl                                           │
│  • subscriptionTier                                    │
│  • preferences (JSONB)                                 │
│  • resumeCount                                         │
│  • Relations: resumes[], subscriptions[], payments[]   │
└─────────────────────────────────────────────────────────┘
```

### Why This Approach?

**Supabase Auth Benefits**:
- 🔐 Secure password hashing (bcrypt)
- 🎫 JWT token generation and validation
- 📧 Email verification flows
- 🔄 OAuth provider integration
- 🔒 Built-in security best practices
- 📱 Session management

**Prisma Benefits**:
- 🎯 Type-safe database queries
- 🔄 Automatic migrations
- 📊 Complex relations and joins
- 🚀 Query optimization
- 🧪 Easy testing with mocks
- 📝 Schema versioning

## Code Examples

### ✅ Correct Implementation

```typescript
// src/services/auth.service.ts
export class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    // Step 1: Create auth user with Supabase
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    
    if (error) throw error;
    
    // Step 2: Create user profile with Prisma
    if (authData.user) {
      await prisma.user.create({
        data: {
          id: authData.user.id,        // Use same ID
          email: authData.user.email!,
          fullName: data.fullName,
        },
      });
    }
    
    return { user: authData.user, session: authData.session };
  }
  
  async signIn(data: SignInData): Promise<AuthResponse> {
    // Step 1: Authenticate with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) throw error;
    
    // Step 2: Update user data with Prisma
    await prisma.user.update({
      where: { id: authData.user.id },
      data: { lastLoginAt: new Date() },
    });
    
    return { user: authData.user, session: authData.session };
  }
}
```

### ❌ Wrong Implementation

```typescript
// DON'T DO THIS!
export class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    // ❌ Using Supabase client for database operations
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    
    // ❌ WRONG: Using Supabase for database insert
    await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: data.fullName,
    });
    
    // This will fail because:
    // 1. Supabase client expects snake_case (full_name)
    // 2. Missing required fields (updated_at)
    // 3. No type safety
    // 4. Bypasses Prisma's validation
  }
}
```

## Best Practices

### 1. Authentication Operations
```typescript
// ✅ Use Supabase Auth
await supabase.auth.signUp()
await supabase.auth.signInWithPassword()
await supabase.auth.getUser()
await supabase.auth.signOut()
```

### 2. Database Operations
```typescript
// ✅ Use Prisma
await prisma.user.create()
await prisma.user.findUnique()
await prisma.user.update()
await prisma.resume.findMany()
```

### 3. User ID Consistency
```typescript
// ✅ Always use the same ID from Supabase Auth
const { data: authData } = await supabase.auth.signUp({ ... });

await prisma.user.create({
  data: {
    id: authData.user.id,  // Same ID!
    email: authData.user.email,
  },
});
```

### 4. Error Handling
```typescript
// ✅ Handle both auth and database errors
try {
  const { data: authData, error: authError } = await supabase.auth.signUp();
  if (authError) throw authError;
  
  await prisma.user.create({ ... });
} catch (error) {
  // Handle error appropriately
  if (error.code === 'P2002') {
    throw new ConflictError('User already exists');
  }
  throw error;
}
```

## Summary

| Operation | Use | Example |
|-----------|-----|---------|
| Sign Up | Supabase Auth | `supabase.auth.signUp()` |
| Sign In | Supabase Auth | `supabase.auth.signInWithPassword()` |
| Token Validation | Supabase Auth | `supabase.auth.getUser()` |
| Create User Profile | Prisma | `prisma.user.create()` |
| Update User Data | Prisma | `prisma.user.update()` |
| Query Users | Prisma | `prisma.user.findMany()` |
| Resume Operations | Prisma | `prisma.resume.*` |
| Subscriptions | Prisma | `prisma.subscription.*` |

**Remember**: 
- 🔐 **Supabase** = Authentication & JWT
- 💾 **Prisma** = Database Operations

This separation keeps our code clean, type-safe, and maintainable!

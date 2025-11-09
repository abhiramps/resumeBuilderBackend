# Authentication Flow Documentation

## Overview

Our authentication system uses **Supabase Auth** for authentication and **Prisma** for database operations.

## Key Principles

1. **User Creation**: Only happens during signup (or OAuth first-time login)
2. **User Updates**: Happen during signin to track last login
3. **Separation of Concerns**: 
   - Supabase Auth = Authentication & JWT tokens
   - Prisma = Database operations

---

## Sign Up Flow

### Endpoint: `POST /auth/signup`

```typescript
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

### Process:

```
1. Validate request body (Joi)
   ↓
2. Create auth user in Supabase Auth
   supabase.auth.signUp()
   ↓
3. Create user profile in database
   prisma.user.create()
   ↓
4. Return user + session tokens
```

### Implementation:

```typescript
async signUp(data: SignUpData): Promise<AuthResponse> {
  // Step 1: Create auth user
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  
  if (error) throw error;
  
  // Step 2: Create user profile (ONLY in signup!)
  if (authData.user) {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        fullName: fullName,
      },
    });
  }
  
  return { user: authData.user, session: authData.session };
}
```

### Success Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

---

## Sign In Flow

### Endpoint: `POST /auth/signin`

```typescript
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Process:

```
1. Validate request body (Joi)
   ↓
2. Authenticate with Supabase Auth
   supabase.auth.signInWithPassword()
   ↓
3. Update last login in database
   prisma.user.update()  ← ONLY update, never create!
   ↓
4. Return user + session tokens
```

### Implementation:

```typescript
async signIn(data: SignInData): Promise<AuthResponse> {
  // Step 1: Authenticate
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Step 2: Update last login (ONLY update, never create!)
  await prisma.user.update({
    where: { id: authData.user.id },
    data: { lastLoginAt: new Date() },
  });
  
  return { user: authData.user, session: authData.session };
}
```

### Success Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "last_sign_in_at": "2025-11-02T12:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### Error Cases:

**User doesn't exist in database** (but exists in Supabase Auth):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Solution**: Run sync script or have user sign up again:
```bash
npm run sync:users
```

---

## OAuth Flow (Google/GitHub)

### Endpoint: `GET /auth/oauth/:provider`

### Process:

```
1. Initiate OAuth flow
   supabase.auth.signInWithOAuth()
   ↓
2. Redirect user to provider
   ↓
3. User authorizes
   ↓
4. Provider redirects to callback
   GET /auth/oauth/callback?code=xxx
   ↓
5. Exchange code for session
   supabase.auth.exchangeCodeForSession()
   ↓
6. Create or update user profile
   prisma.user.upsert()  ← upsert is OK for OAuth!
   ↓
7. Return user + session tokens
```

### Why upsert for OAuth?

OAuth users might not have gone through our signup flow. They authenticate directly with Google/GitHub, so we need to create their profile on first login.

### Implementation:

```typescript
async handleOAuthCallback(code: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) throw error;
  
  // OAuth users might not exist in our DB, so we use upsert
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        lastLoginAt: new Date(),
        avatarUrl: data.user.user_metadata.avatar_url,
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        fullName: data.user.user_metadata.full_name || data.user.email!,
        avatarUrl: data.user.user_metadata.avatar_url,
        lastLoginAt: new Date(),
      },
    });
  }
  
  return { user: data.user, session: data.session };
}
```

---

## Protected Routes

### Middleware: `authenticate`

```typescript
router.get('/users/me', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // User is authenticated
});
```

### Process:

```
1. Extract JWT from Authorization header
   ↓
2. Validate token with Supabase
   supabase.auth.getUser(token)
   ↓
3. Attach user to request
   req.user = { id, email }
   ↓
4. Continue to route handler
```

---

## Summary Table

| Operation | Endpoint | Supabase Auth | Prisma | Notes |
|-----------|----------|---------------|--------|-------|
| **Sign Up** | POST /auth/signup | `signUp()` | `create()` | Creates user in both |
| **Sign In** | POST /auth/signin | `signInWithPassword()` | `update()` | Only updates, never creates |
| **OAuth** | GET /auth/oauth/callback | `exchangeCodeForSession()` | `upsert()` | Creates if first time |
| **Sign Out** | POST /auth/signout | `signOut()` | - | No DB operation |
| **Refresh** | POST /auth/refresh | `refreshSession()` | - | No DB operation |
| **Protected** | Any protected route | `getUser()` | - | Validates JWT |

---

## Best Practices

### ✅ DO:

1. **Use `create()` in signup** - User should only be created once
2. **Use `update()` in signin** - Only update existing users
3. **Use `upsert()` in OAuth** - OAuth users might not exist yet
4. **Validate tokens with Supabase** - Always use `supabase.auth.getUser()`
5. **Keep IDs in sync** - Use same ID from Supabase Auth in Prisma

### ❌ DON'T:

1. **Don't use `upsert()` in signin** - Signin should not create users
2. **Don't use Supabase client for DB operations** - Use Prisma instead
3. **Don't create users with different IDs** - Always use Supabase Auth ID
4. **Don't skip error handling** - Always handle Prisma errors properly
5. **Don't bypass authentication** - Always validate tokens

---

## Error Handling

### Signup Errors:

```typescript
try {
  await authService.signUp(data);
} catch (error) {
  if (error.code === 'P2002') {
    // User already exists in database
    throw new ConflictError('User already exists');
  }
  if (error.message.includes('User already registered')) {
    // User already exists in Supabase Auth
    throw new ConflictError('Email already registered');
  }
  throw error;
}
```

### Signin Errors:

```typescript
try {
  await authService.signIn(data);
} catch (error) {
  if (error.code === 'P2025') {
    // User not found in database
    throw new NotFoundError('User not found. Please sign up first.');
  }
  if (error.message.includes('Invalid login credentials')) {
    // Wrong password or email
    throw new UnauthorizedError('Invalid credentials');
  }
  throw error;
}
```

---

## Troubleshooting

### Issue: "User not found" on signin

**Cause**: User exists in Supabase Auth but not in database

**Solution**:
```bash
npm run sync:users
```

### Issue: "User already exists" on signup

**Cause**: User already registered

**Solution**: Use signin instead, or delete user from Supabase dashboard

### Issue: ID mismatch

**Cause**: Database and Supabase Auth have different IDs for same email

**Solution**:
```bash
npx ts-node scripts/cleanup-user.ts
# Then signin again
```

---

## Testing

### Test Signup:
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","fullName":"Test User"}'
```

### Test Signin:
```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### Test Protected Route:
```bash
TOKEN="your_access_token"
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

**Remember**: 
- 🔐 **Signup** = Create user (Supabase Auth + Prisma)
- 🔑 **Signin** = Update user (only Prisma update)
- 🌐 **OAuth** = Upsert user (might be first time)

# Troubleshooting Guide

## Common Issues and Solutions

### 1. "No record was found for an update" Error on Sign In

**Error Message**:
```
Invalid `prisma.user.update()` invocation
An operation failed because it depends on one or more records that were required but not found.
```

**Cause**: User exists in Supabase Auth but not in Prisma database.

**Solution**: The signin now uses `upsert` which automatically creates the user if missing. Just try signing in again.

**Manual Fix** (if needed):
```bash
npm run sync:users
```

This script syncs all users from Supabase Auth to Prisma database.

---

### 2. "null value in column 'updated_at'" Error on Sign Up

**Error Message**:
```
null value in column "updated_at" of relation "users" violates not-null constraint
```

**Cause**: Using Supabase client for database operations instead of Prisma.

**Solution**: ✅ Already fixed! We now use Prisma for all database operations.

**Code Pattern**:
```typescript
// ❌ WRONG
await supabase.from('users').insert({ ... });

// ✅ CORRECT
await prisma.user.create({ ... });
```

---

### 3. Database Connection Timeout

**Error Message**:
```
Can't reach database server at aws-1-ap-southeast-2.pooler.supabase.com:6543
```

**Possible Causes**:
1. Supabase project is paused
2. Wrong DATABASE_URL
3. Network/firewall issues

**Solutions**:

1. **Check Supabase Project**:
   - Go to https://app.supabase.com
   - Ensure project is active (not paused)

2. **Verify Environment Variables**:
   ```bash
   cat .env | grep DATABASE_URL
   ```

3. **Test Connection**:
   ```bash
   npx ts-node scripts/test-connection.ts
   ```

4. **Use Direct Connection**:
   If pooled connection fails, temporarily use DIRECT_URL:
   ```env
   DATABASE_URL="${DIRECT_URL}"
   ```

---

### 4. Prisma Client Not Generated

**Error Message**:
```
Cannot find module '@prisma/client'
```

**Solution**:
```bash
npm run prisma:generate
```

Or rebuild:
```bash
npm run build
```

---

### 5. Migration Conflicts

**Error Message**:
```
Migration failed to apply
```

**Solutions**:

**Development** (safe to reset):
```bash
npx prisma migrate reset
npx prisma migrate dev
```

**Production** (careful!):
```bash
npx prisma migrate resolve --applied "migration_name"
npx prisma migrate deploy
```

---

### 6. User Already Exists in Supabase Auth

**Error Message**:
```
User already registered
```

**Cause**: Email already used in Supabase Auth.

**Solutions**:

1. **Sign in instead of signing up**

2. **Delete user from Supabase** (development only):
   - Go to Supabase Dashboard
   - Authentication > Users
   - Delete the user
   - Try signup again

3. **Use different email**

---

### 7. JWT Token Invalid or Expired

**Error Message**:
```
Invalid or expired token
```

**Causes**:
1. Token expired (default: 1 hour)
2. User signed out
3. Token malformed

**Solutions**:

1. **Refresh Token**:
   ```bash
   curl -X POST http://localhost:3001/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
   ```

2. **Sign in again**:
   Get new tokens by signing in

---

### 8. Port 3001 Already in Use

**Error Message**:
```
EADDRINUSE: address already in use :::3001
```

**Solutions**:

1. **Find and kill process**:
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Use different port**:
   ```bash
   PORT=3002 npm run dev
   ```

---

### 9. TypeScript Compilation Errors

**Error Message**:
```
error TS2339: Property 'xyz' does not exist
```

**Solutions**:

1. **Regenerate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

2. **Check imports**:
   ```typescript
   import { prisma } from '../utils/prisma';  // ✅
   import { supabase } from '../utils/supabase';  // ✅
   ```

3. **Rebuild**:
   ```bash
   rm -rf dist
   npm run build
   ```

---

### 10. Supabase Service Key Missing

**Error Message**:
```
Missing required environment variable: SUPABASE_SERVICE_KEY
```

**Solution**:

1. Get service key from Supabase:
   - Dashboard > Settings > API
   - Copy "service_role" key (not anon key!)

2. Add to `.env`:
   ```env
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```

---

## Debugging Tips

### 1. Enable Prisma Query Logging

Edit `src/utils/prisma.ts`:
```typescript
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],  // Enable all logs
});
```

### 2. Check Supabase Auth User

```bash
# In Supabase Dashboard
# Authentication > Users
# Check if user exists and is confirmed
```

### 3. Check Database Records

```bash
npm run prisma:studio
# Opens GUI at http://localhost:5555
# Browse users table
```

### 4. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Sign up
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","fullName":"Test User"}'

# Sign in
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### 5. Check Server Logs

When running `npm run dev`, watch the console for errors:
```
ANY /auth/signup (λ: api)
Unexpected error: ...
```

---

## Sync Users Script

If users exist in Supabase Auth but not in Prisma database:

```bash
npm run sync:users
```

This will:
1. Fetch all users from Supabase Auth
2. Check if they exist in Prisma
3. Create missing users
4. Show summary

**Output**:
```
🔄 Starting user sync...
📊 Found 3 users in Supabase Auth

✅ Synced user1@example.com
⏭️  Skipping user2@example.com - already exists
✅ Synced user3@example.com

📈 Sync Summary:
   ✅ Synced: 2
   ⏭️  Skipped: 1
   ❌ Errors: 0

✅ User sync complete!
```

---

## Quick Fixes

### Reset Everything (Development Only!)

```bash
# 1. Reset database
npx prisma migrate reset

# 2. Apply migrations
npx prisma migrate dev

# 3. Regenerate client
npm run prisma:generate

# 4. Rebuild
npm run build

# 5. Restart server
npm run dev
```

### Clean Build

```bash
rm -rf dist node_modules/.prisma
npm run build
```

### Verify Setup

```bash
# 1. Check environment
cat .env | grep -E "DATABASE_URL|SUPABASE"

# 2. Test database
npx ts-node scripts/test-connection.ts

# 3. Run tests
npm test

# 4. Check build
npm run build
```

---

## Getting Help

### Check Documentation
- `ARCHITECTURE.md` - System architecture
- `PHASE_2_COMPLETE.md` - Authentication details
- `PRISMA_SETUP_COMPLETE.md` - Database setup
- `QUICK_START.md` - Quick start guide

### Common Commands
```bash
npm run dev              # Start server
npm test                 # Run tests
npm run build            # Build project
npm run prisma:studio    # Open database GUI
npm run sync:users       # Sync users
```

### Still Having Issues?

1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Try the sync users script
5. Check Prisma Studio for database state

---

**Remember**: 
- 🔐 Supabase = Authentication
- 💾 Prisma = Database Operations
- 🔄 Use `upsert` for flexible user creation

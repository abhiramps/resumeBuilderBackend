# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Node 22 + TypeScript (strict). Express apps wrapped with `serverless-http` and deployed as individual AWS Lambda functions via Serverless Framework v4 + esbuild. Postgres via Supabase, accessed through Prisma 7 with the `@prisma/adapter-pg` adapter. Supabase Auth for identity. Stripe for payments. Winston for logging, Joi for validation.

## Common commands

```bash
npm run dev                    # nodemon → rebuild + serverless-offline (port 3001 by default)
npm run dev:local              # same, but loads .env.local (local Supabase stack)
npm run build                  # prisma generate (no tsc — esbuild handles bundling at deploy time)
npm test                       # jest (ts-jest), tests live in tests/**/*.test.ts
npm test -- tests/integration/auth.test.ts   # run a single test file
npm run lint                   # eslint src/**/*.ts
npm run prisma:push            # push schema to DB (uses DATABASE_URL from .env)
npm run prisma:studio          # open Prisma Studio
npm run deploy:dev             # deploy to dev stage (loads .env.dev)
npm run deploy:prod            # deploy to production stage (loads .env.prod)
./test-server.sh               # smoke-test local server (health, 404, auth)
```

Local Supabase: `supabase start` then `npm run dev:local`. See `SUPABASE_LOCAL_SETUP.md`.

## Architecture

### Per-route Lambdas, not a monolithic API

`serverless.yml` defines **one Lambda function per resource** (`auth`, `users`, `resumes`, `versions`, `sharing`, `health`, `exportPdf`). Each function has its own handler file in `src/handlers/` that builds its own Express app, registers its own middleware stack, and exports `handler = serverless(app)`. API Gateway (httpApi) routes path prefixes to the correct function.

Consequence: middleware (`requestLogger`, `helmet`, `express.json`, `errorHandler`) and the `Router` are duplicated in every handler file by design — they're independent Lambda bundles. Don't try to centralize this into a single app.

### Dual route mounting

Each handler mounts its router twice:

```ts
app.use('/resumes', router);   // when invoked locally / direct path
app.use('/', router);          // when API Gateway has already stripped the prefix
```

Keep this pattern when adding new handlers — both paths must work.

### CORS lives in `serverless.yml`, not Express

`provider.httpApi.cors` is the source of truth. Allowed origins are hardcoded there (Vercel preview, resumebuildr.org, localhost:3000). Don't add `cors()` middleware to handlers (the `export.ts` handler does — that's an outlier and shouldn't be copied).

### Two different "export" concepts

- `POST /resumes/export` → **`exportPdf` Lambda** (`src/handlers/export.ts`). Generates a PDF from `{html, css}` using `puppeteer-core` + `@sparticuz/chromium` from a Lambda Layer. 3008 MB memory, 2048 MB ephemeral storage.
- `GET /resumes/:id/export` → **`resumes` Lambda** (`ResumeService.export`). Returns a JSON snapshot of the resume.
- `POST /resumes/export` is **also** declared inside `resumes.ts` as bulk JSON export, but the explicit `exportPdf` route in `serverless.yml` shadows it in deployed envs. Treat the bulk-export route as effectively unreachable in production unless `serverless.yml` changes.

### PDF service environment detection

`PdfService.getBrowser()` switches Chromium binary path on `AWS_LAMBDA_FUNCTION_VERSION` / `AWS_EXECUTION_ENV` (Lambda) vs falls back to a local `google-chrome` install. `IS_OFFLINE` forces local mode under serverless-offline. `@sparticuz/chromium` is marked `external` in `serverless.yml` esbuild config — it's loaded from the layer ARN, not bundled. See `.deployment-notes.md` for the 250 MB Lambda size constraint history.

### Prisma client

`src/utils/prisma.ts` is the only place that constructs `PrismaClient`. It builds a `pg.Pool` against `DATABASE_URL`, wraps it with `PrismaPg`, and stores both pool and client on `globalThis` in non-production to survive hot reloads. **Always import `{ prisma }` from `src/utils/prisma`** — never `new PrismaClient()`.

### Layered structure

```
handler  → middleware (auth, validate, logger, error)
         → service (business logic + Prisma)
         → utils/prisma  (singleton)
```

Handlers should be thin: parse inputs, call service, format response. Services own DB access, ownership checks, and subscription-limit enforcement. Validation schemas live in `src/validators/*.validators.ts` (Joi). Custom errors in `src/utils/errors.ts` extend `AppError`; the central `errorHandler` middleware maps them to JSON `{ success: false, error: { code, message } }`.

### Auth flow

`authenticate` middleware (`src/middleware/auth.middleware.ts`) extracts the Bearer token and calls `supabase.auth.getUser(token)` on every request — there is no local JWT cache. It attaches both `req.user` (id, email) and `req.supabaseUser` (raw Supabase user). Use `optionalAuth` for endpoints that work with or without a session (e.g., public resume views).

Resource ownership is enforced inside services with `findFirst({ where: { id, userId, deletedAt: null } })` — there is no DB-level RLS in the Prisma schema, so service-layer ownership checks are mandatory for any protected entity.

### Subscription limits

Hardcoded in `src/utils/subscription-limits.ts` (free=3 resumes, pro=20, enterprise=unlimited). Services call `checkSubscriptionLimits(userId, 'max_resumes')` before create/duplicate/import. The Prisma `User.subscriptionTier` field drives the lookup.

### Soft deletes + version snapshots

`Resume.deletedAt` is a soft-delete timestamp — every read filters `deletedAt: null`. `ResumeVersion` is a separate snapshot table; `VersionService.restoreVersion` auto-creates a snapshot of the current state before overwriting, so restores are themselves reversible.

### Resume content shape

`Resume.content` is JSONB. Search uses Prisma JSON path queries (e.g. `path: ['personalInfo', 'fullName']`). Validation of the JSON shape happens in `src/validators/resume.validators.ts` — that file is the de facto schema for resume content.

## Conventions

- File suffixes: `.service.ts`, `.middleware.ts`, `.validators.ts`, `.types.ts`. Handlers use plain names (`auth.ts`, `resumes.ts`).
- Response envelope: success → `{ data, pagination? }`; error → `{ success: false, error: { code, message } }`.
- Don't `console.log` — use `logger` from `src/utils/logger.ts` (eslint warns on `no-console`).
- TypeScript strict mode is on with `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns`. Prefix unused params with `_`.
- The `.kiro/steering/` directory holds the original project guidelines (project-guidelines.md, security-guidelines.md). Treat them as authoritative for patterns not covered here.
- `general.md` steering rule: don't create summary markdown files unless explicitly requested.

## Deploy region & AWS profile

`ap-south-1`, profile `personal`. Chromium layer ARN is hardcoded for that region: `arn:aws:lambda:ap-south-1:407800164427:layer:chromium-sparticuz:2`. If deploying to another region, the layer must be re-published there.

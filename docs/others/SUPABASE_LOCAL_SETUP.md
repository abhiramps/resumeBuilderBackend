# Supabase Local Development Setup

This document describes the local Supabase environment setup for the Resume Builder Backend.

## Installation Status

- **Supabase CLI**: Installed.
- **Project Initialized**: Yes (`supabase init`).
- **Local Stack**: Running (`supabase start`).
- **Configuration**: Saved in `.env.local`.
- **Database**: Synced with Prisma schema (`npx prisma db push`).

## How to Run Locally

To start the backend using the local Supabase instance/database:

```bash
npm run dev:local
```

This script loads variables from `.env.local` and starts the serverless-offline server via nodemon.

## Managing Local Supabase

- **Start Services**: `supabase start` (If not already running)
- **Stop Services**: `supabase stop`
- **View Status**: `supabase status` (Shows URLs and Keys)
- **Studio Dashboard**: Visit [http://127.0.0.1:54323](http://127.0.0.1:54323) to manage your local database and auth.

## Database Migrations

When you change `prisma/schema.prisma`, update the local database:

```bash
DOTENV_CONFIG_PATH=.env.local npx prisma db push
```

## Environment Variables

The `.env.local` file contains the generated keys for your local instance:

- `DATABASE_URL` (Port 54322)
- `SUPABASE_URL`
- `SUPABASE_KEY` (Anon)
- `SUPABASE_SERVICE_KEY` (Service Role)

**Note:** Do not commit `.env.local` to git if it contains sensitive real credentials (though local default keys are generally safe/public knowledge for dev).

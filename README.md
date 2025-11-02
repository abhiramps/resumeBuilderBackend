# Resume Builder Backend

Serverless backend API for the ATS-Friendly Resume Builder application.

## Tech Stack

- **Runtime**: Node.js 22.x with TypeScript
- **Framework**: Express.js + Serverless Framework
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Deployment**: AWS Lambda + API Gateway

## Project Structure

```
resumeBuilderBackend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   ├── services/          # Business logic
│   ├── models/            # Database models
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── config/            # Configuration
├── tests/                 # Test files
├── prisma/                # Prisma schema and migrations
├── docs/                  # Documentation
└── serverless.yml         # Serverless config
```

## Setup

### Prerequisites

- Node.js 22.x LTS
- npm 10.x or yarn 4.x
- AWS CLI configured
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
   - Supabase URL and keys
   - Stripe keys
   - JWT secret
   - Database URL

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Push schema to database:
```bash
npm run prisma:push
```

## Development

### Start local server:
```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Test health endpoint:
```bash
curl http://localhost:3000/health
```

### Other commands:
```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Open Prisma Studio
npm run prisma:studio
```

## Deployment

### Deploy to staging:
```bash
npm run deploy:dev
```

### Deploy to production:
```bash
npm run deploy:prod
```

## Environment Variables

See `.env.example` for required environment variables.

## API Documentation

API documentation will be available at `/docs` once implemented.

## License

ISC

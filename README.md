# Real Estate AI Backend

A single-package NestJS backend using npm, PostgreSQL 17, and Prisma 7.

## Requirements

- Node.js 22 LTS
- npm 10+
- Docker Desktop

## Start development

```powershell
npm install
docker compose up -d
npm run db:migrate
npm run dev
```

The API uses the port configured in `.env` (currently `3030`):

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## Commands

```powershell
npm run dev             # API with Nest compiler watch mode
npm run dev:worker      # Lightweight worker shell
npm run build           # Generate Prisma client and compile
npm run start           # Run compiled API
npm run start:worker    # Run compiled worker
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:studio
```

Prisma owns its schema and migrations under `prisma/`. Generated client code is
written to `src/generated/`, is not committed, and is regenerated automatically
before development, type-checking, and builds.

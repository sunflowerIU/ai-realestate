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
npm test
npm run db:generate
npm run db:migrate
npm run db:studio
```

Prisma owns its schema and migrations under `prisma/`. Generated client code is
written to `src/generated/`, is not committed, and is regenerated automatically
before development, type-checking, and builds.

## Accounts and CRM

There is no public registration endpoint. Create the first platform admin with
`npm run admin:create` after setting `PLATFORM_ADMIN_NAME`,
`PLATFORM_ADMIN_EMAIL`, and `PLATFORM_ADMIN_PASSWORD` in the environment.
An authenticated platform admin can create and manage agents at
`/api/v1/admin/agents`. Agent status changes revoke refresh sessions in the
same database transaction. Existing access tokens expire according to
`JWT_ACCESS_TTL`.

Authenticated agents can create, list, search, read, update, and delete their
own clients at `/api/v1/clients`. Client ownership always comes from the access
token. Client deletion is permanent when unreferenced; foreign keys prevent
deleting a client linked to another CRM record. Collection responses use
`{ items, pagination }`, with `pageSize` capped at 100.

The agent API also includes `/api/v1/properties`, `/api/v1/requirements`,
`/api/v1/activities`, `/api/v1/visits`, and `/api/v1/deals`. Property deletion
uses `POST /api/v1/properties/:id/archive`. Prices and commissions are sent
as whole NPR strings. Property land areas are supplied as
`{ "value": "4", "unit": "AANA" }` and stored in integer square millimeters
alongside the original value and unit. Buyer requirement area filters use
square meter decimal strings. Money and land normalization avoid JavaScript
floating point calculations.

All foreign links to agent data use compound keys with `agentId`. The database
rejects cross-agent references. Visit and deal requirement links also enforce
the same client in PostgreSQL. Run `npm test` for fast ownership and unit tests.

For HTTP isolation tests, use a dedicated migrated PostgreSQL database and set
`TEST_DATABASE_URL` before running `npm run test:integration`. The test creates
temporary agents and removes their records afterward. Do not point this test
at the application database.

## Remaining backend work

The deterministic matching endpoint and the large Excel import pipeline are
not implemented yet. The import pipeline still needs object storage, BullMQ,
Redis, workbook streaming, staged rows, mapping review, and deduplication.
Rate limiting, audit records, and production database performance checks also
remain. No AI or LLM integration is included.

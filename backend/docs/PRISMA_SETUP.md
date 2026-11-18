# Prisma ORM Setup Guide (Supabase PostgreSQL)

This backend uses **Prisma ORM v6** with **Supabase PostgreSQL** and integrates it into NestJS via a global `PrismaModule`.

## 1. Prerequisites

- Node.js and npm installed
- Dependencies installed in `backend/`:
  ```bash
  cd backend
  npm install
  ```
- A Supabase project (when ready to connect to a live database)

## 2. Configure Environment Variables

1. Copy `.env.example` to `.env` inside `backend/`:
   ```bash
   cp .env.example .env
   ```
2. Open your **Supabase Dashboard**, click **Connect** (or navigate to **Project Settings -> Database -> Connection string**), and select **URI** (or **Prisma**).
3. Fill in both variables in `backend/.env`:
   - `DATABASE_URL`: Use the **Transaction pooler** URI on port **`6543`** with `?pgbouncer=true` appended. Prisma Client uses this pooled connection at runtime.
   - `DIRECT_URL`: Use the **Direct connection** URI on port **`5432`**. Prisma CLI (`prisma db push`, `prisma migrate`) uses this direct connection to bypass PgBouncer.

> **Security:** `.env` is listed in `backend/.gitignore`. Never commit `.env` or real database credentials to Git.

## 3. Validate Schema & Generate Prisma Client

Ensure `backend/.env` exists (even with placeholder values copied from `.env.example`) because `prisma validate` checks that `DATABASE_URL` and `DIRECT_URL` are defined. Then validate `prisma/schema.prisma` and generate the typed `@prisma/client`:

```bash
npx prisma validate
npm run db:generate
```

## 4. Push Schema to Supabase

Once a real Supabase `DATABASE_URL` and `DIRECT_URL` are configured in `backend/.env`, push the schema (`User`, `Project`, `Folder`, `Diagram`) to PostgreSQL:

```bash
npm run db:push
```

## 5. Test the Database Connection

Once a real `DATABASE_URL` exists in `backend/.env`, verify connectivity by running:

```bash
npm run db:check
```

This executes `scripts/test-db-connection.ts`, which connects with `PrismaClient`, runs `SELECT 1`, and disconnects cleanly.

## 6. Using Prisma in NestJS

`PrismaModule` (`src/prisma/prisma.module.ts`) is decorated with `@Global()` and registered in `AppModule` (`src/app.module.ts`). Inject `PrismaService` into any NestJS service or controller without re-importing `PrismaModule`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}
}
```

## 7. NPM Scripts Reference

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run db:generate` | `prisma generate` | Generates Prisma Client from `prisma/schema.prisma` |
| `npm run db:push` | `prisma db push` | Pushes schema changes directly to PostgreSQL using `DIRECT_URL` |
| `npm run db:check` | `ts-node scripts/test-db-connection.ts` | Tests live PostgreSQL connectivity with `SELECT 1` |

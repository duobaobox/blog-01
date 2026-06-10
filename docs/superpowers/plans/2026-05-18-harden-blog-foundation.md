# Harden Blog Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten first-admin bootstrap security, remove automatic schema mutation from app startup, and add regression coverage for the article materialization chain.

**Architecture:** Keep behavior changes small and local. Extract bootstrap-token validation into a pure helper so the auth route can enforce it and Node tests can cover it without a database. Use Node's built-in test runner through `tsx` to avoid adding a new test framework.

**Tech Stack:** Next.js App Router, Better Auth route handler, Prisma, Tiptap, Node `node:test`, `tsx`.

---

### Task 1: Add Test Harness And Regression Tests

**Files:**
- Modify: `package.json`
- Create: `src/infrastructure/auth/bootstrap-token.test.ts`
- Create: `src/features/editor/content-materializer.test.ts`

- [x] **Step 1: Add `test` script**

Add `node --import tsx --test` as the project test command.

- [x] **Step 2: Write failing bootstrap-token tests**

Cover these behaviors:
- Production bootstrap rejects sign-up when `ADMIN_SETUP_TOKEN` is missing.
- Production bootstrap rejects a missing request token.
- Production bootstrap accepts a matching request token.
- Development bootstrap remains open when no token is configured.

- [x] **Step 3: Write content materializer tests**

Cover these behaviors:
- Heading IDs are generated from Chinese pinyin and duplicated headings get suffixes.
- Plain text, TOC, word count, and reading time are derived from the same JSON source.

- [x] **Step 4: Run tests to verify RED**

Run `npm test`. Expected: bootstrap-token test fails because the helper does not exist yet.

### Task 2: Enforce Admin Bootstrap Token

**Files:**
- Create: `src/infrastructure/auth/bootstrap-token.ts`
- Modify: `src/app/api/auth/[...all]/route.ts`
- Modify: `.env.example`
- Modify: `README.md`

- [x] **Step 1: Implement pure token validation helper**

Create `parseBootstrapTokenFromHeaders()` and `isAdminBootstrapRequestAllowed()` with production-safe defaults.

- [x] **Step 2: Wire token validation into sign-up route**

For `/sign-up/email`, reject requests when the database is empty but the token check fails.

- [x] **Step 3: Document the header and deployment requirement**

Clarify that `ADMIN_SETUP_TOKEN` must be set in production and sent as `x-admin-setup-token` during first setup.

- [x] **Step 4: Run focused tests**

Run `npm test -- src/infrastructure/auth/bootstrap-token.test.ts`.

### Task 3: Stop Mutating Schema During App Startup

**Files:**
- Modify: `Dockerfile`
- Modify: `scripts/release/start-offline-stack.sh`
- Modify: `docs/docker-build-and-release-guide.md`
- Modify: `docs/offline-image-delivery-guide.md`
- Modify: `docs/release-and-rollback-checklist.md`

- [x] **Step 1: Remove `db:push` from app CMD**

Change app startup to `npm start`.

- [x] **Step 2: Keep explicit migrate step in deployment scripts**

Ensure offline start still runs the migrate tool before seed.

- [x] **Step 3: Update docs to state migration is explicit**

Make the deployment docs match the runtime behavior.

### Task 4: Final Verification

**Files:**
- No new files.

- [x] **Step 1: Run test suite**

Run `npm test`.

- [x] **Step 2: Run lint**

Run `npm run lint`.

- [x] **Step 3: Run build**

Run `npm run build`.

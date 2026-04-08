---
name: e2e-test-writer
description: Write and run Playwright end-to-end tests for this repo. Use when adding or updating browser-based integration coverage, debugging existing Playwright flows, or validating login/protected-route behavior against the isolated Playwright test stack.
---

# E2E Test Writer

Use the existing Playwright setup in this repository.

## Project-specific setup

- Playwright config lives at `playwright.config.ts`.
- Tests live under `playwright/tests`.
- Shared Playwright helpers live under `playwright/helpers`.
- Playwright uses the dedicated env file `server/.env.playwright`.
- The isolated Playwright database is `helpdesk_playwright`.
- Playwright server defaults:
  - backend: `http://127.0.0.1:4100`
  - frontend: `http://127.0.0.1:4173`

## Database and startup workflow

- `playwright.config.ts` runs `playwright/global.setup.ts` before tests.
- `playwright/global.setup.ts` runs `npm run playwright:db:setup`.
- `npm run playwright:db:setup` executes:
  1. `prisma db push`
  2. `prisma db seed`
- Do not add manual test bootstrap steps that duplicate this flow unless the existing setup is insufficient.

## Credentials available in the Playwright test database

- Admin user:
  - email: `admin@example.com`
  - password: `qwerdf66`

## Commands

- Install browsers: `npm run playwright:install`
- Run tests: `npm run playwright:test`
- Run tests in UI mode: `npm run playwright:test:ui`
- Sync schema only: `npm run playwright:db:push`
- Seed only: `npm run playwright:db:seed`
- Full Playwright DB setup: `npm run playwright:db:setup`

## Authoring guidance

- Prefer accessible selectors such as labels, roles, and visible headings.
- Keep tests concise and stable.
- Reuse helpers in `playwright/helpers` when login or repeated setup appears in multiple specs.
- Keep Playwright-only support code inside `playwright/**` unless an app change is truly required.
- Use the seeded admin account for auth flows unless the test explicitly requires another role.

## Current covered flow

- `playwright/tests/auth.spec.ts` covers:
  - unauthenticated redirect from `/` to `/login`
  - admin login
  - admin access to `/users`

# Exercise 5.3 – BDD Test Automation (StudyConnect)

This document describes how BDD (Cucumber + Gherkin) acceptance tests are automated for the StudyConnect backend and how to execute them.

## Goal
Automate Gherkin-based acceptance tests so they can be executed reliably alongside the project’s unit tests, with clear configuration, scripts, and reports.

## What’s implemented
- Gherkin features: `backend/src/__tests__/bdd/features/`
  - `user_registration.feature`
  - `task_management.feature`
  - `group_management.feature`
- Step definitions: `backend/src/__tests__/bdd/steps/`
  - `userRegistration.steps.ts`, `taskManagement.steps.ts`, `groupManagement.steps.ts`
- Support files: `backend/src/__tests__/bdd/support/`
  - `world.ts` (shared test state), `hooks.ts`
- Cucumber config: project root `cucumber.js` (points to backend features/steps)
- NPM script (backend): `"test:bdd": "cucumber-js --config ../cucumber.js"`
- HTML report: `backend/src/__tests__/bdd/reports/cucumber-report.html`

## Dependencies
Installed in `backend/devDependencies`:
- `@cucumber/cucumber`
- `ts-node` (TypeScript runtime for steps)
- `chai` (assertions)
- `supertest` (HTTP assertions against the API)

TypeScript config for BDD: `backend/src/__tests__/bdd/tsconfig.json`.

## How to run
Prerequisites:
- PostgreSQL running locally (see `docker-compose.yml`).
  - Start DB: `docker compose up -d` (from repo root)

Run tests (from backend folder):
- Unit tests: `npm run test`
- BDD tests: `npm run test:bdd`

Notes:
- Importing `src/server.ts` starts the API automatically for the BDD run and applies migrations/seed data.
- The Cucumber HTML report is written to `backend/src/__tests__/bdd/reports/cucumber-report.html`.

## Configuration details
- `cucumber.js` sets:
  - `requireModule: ['ts-node/register/transpile-only']`
  - `require`: step and support globs under `backend/src/__tests__/bdd/`
  - `paths`: feature files under `backend/src/__tests__/bdd/features/`
  - `format`: progress + HTML report output

## Execution strategy (decision and reasoning)
- Unit tests run frequently (on each commit and locally while developing) to keep the feedback loop fast.
- BDD/acceptance tests run on demand locally and in CI less frequently (e.g., nightly or before a release), because they:
  - Boot the API and touch more of the stack → slower than unit tests.
  - Cover end-to-end user journeys rather than granular logic.

This separation balances fast iteration for developers with regular validation of user-visible behavior.

## Troubleshooting
- “No scenarios found”: verify feature paths match `cucumber.js` globs.
- “Ambiguous steps”: ensure each step text maps to exactly one step definition.
- DB connection errors: ensure Postgres is up (`docker compose up -d`) and env matches.
- Port 3000 in use: stop other servers or change `PORT`.

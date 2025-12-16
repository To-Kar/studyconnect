# Exercise 5 – BDD & Gherkin Syntax (StudyConnect)

## Overview

BDD test implementation for StudyConnect using Cucumber.js, TypeScript, Supertest, and Chai. Covers user registration, task management, and group collaboration scenarios.

---

## Exercise 5.1 - User Stories (Gherkin)

**Location:** `backend/src/__tests__/bdd/features/`

### Features Implemented

1. **User Registration** - 4 scenarios
   - Successful registration
   - Duplicate email validation
   - User login (success/failure)
   - Password reset request
   
2. **Task Management** - 5 scenarios
   - Create task
   - Complete task with points
   - Edit task
   - Delete task
   - Filter tasks by priority
   
3. **Group Management** - 4 scenarios
   - Create group
   - Join existing group
   - Leave group
   - Join non-existing group (error handling)

**Example Scenario:**
```gherkin
Feature: User Registration
  Scenario: Successful user registration
    Given the StudyConnect API is running
    When I register with a unique email and username
    Then the registration should succeed with status 201
    And the response should include my user id and username
```

---

## Exercise 5.2 - Step Definitions

**Location:** `backend/src/__tests__/bdd/steps/`

### Architecture

**World Object** (`support/world.ts`):
```typescript
export class CustomWorld {
  baseUrl: string;
  authToken?: string;
  lastResponse?: Response;
  currentTaskId?: string;
  groupId?: string;
}
```

**Step Files:**
- `userRegistration.steps.ts` - Auth scenarios with unique emails
- `taskManagement.steps.ts` - Task CRUD and points validation
- `groupManagement.steps.ts` - Group creation and joining


---

## Exercise 5.3 - Test Automation

### Configuration

**Cucumber Config** (`cucumber.js`):
```javascript
module.exports = {
  default: {
    requireModule: ["ts-node/register/transpile-only"],
    require: ["src/__tests__/bdd/steps/**/*.ts", "src/__tests__/bdd/support/**/*.ts"],
    paths: ["src/__tests__/bdd/features/**/*.feature"],
    format: ["progress", "summary", "html:src/__tests__/bdd/reports/cucumber-report.html"]
  }
};
```

**NPM Scripts** (`backend/package.json`):
```json
{
  "test": "jest",
  "test:bdd": "cucumber-js --config ../cucumber.js"
}
```

### Server Lifecycle

**Problem:** Tests need API running but must control lifecycle.

**Solution:** Export `startServer()` function with DB readiness probe:
```typescript
// backend/src/server.ts
export async function startServer(): Promise<Server> {
  await ensureDatabaseReady();
  await runMigrations();
  await seedDatabase();
  return app.listen(PORT);
}
```

**Hooks** (`support/hooks.ts`):
```typescript
BeforeAll: server = await startServer();
AfterAll: await pool.end(); server.close(); setTimeout(() => process.exit(0), 750);
```

---

## How to Run

### Locally

```bash
# Start PostgreSQL
docker compose up -d postgres

# Install & run BDD tests
cd backend
npm install
npm run test:bdd

# View HTML report
open src/__tests__/bdd/reports/cucumber-report.html
```

**Expected Output:**
```
✅ Database migrations completed
🚀 StudyConnect API running on http://localhost:3000
.............................................................................
14 scenarios (14 passed)
73 steps (73 passed)
0mXX.XXXs
```

### Unit Tests (Jest)
```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

---

## CI/CD Integration

**File:** `.github/workflows/tests.yml`

**Workflow:**
```yaml
services:
  postgres:
    image: postgres:16
    options: --health-cmd="pg_isready" --health-interval=10s

steps:
  - Checkout & setup Node.js 20
  - Install dependencies (root & backend)
  - Set DB environment variables
  - Run BDD tests
  - Upload HTML report artifact
```

**Triggers:**
- Push to `main`
- Pull requests
- Manual dispatch

**Viewing Results:**
1. Go to [GitHub Actions](https://github.com/To-Kar/studyconnect/actions/workflows/tests.yml)
2. Expand "Run BDD tests" step
3. Download `cucumber-report` artifact

---

## Test Execution Strategy

### Unit Tests (Jest) - Fast Feedback
- **Frequency:** Every commit, watch mode during dev
- **Speed:** < 10 seconds
- **Use Case:** Function/class validation, high frequency

### BDD Tests (Cucumber) - End-to-End Validation
- **Frequency:** Pre-release, nightly, CI/CD
- **Speed:** 3-10 seconds (boots API + DB)
- **Use Case:** User journey validation, integration testing

**Workflow Table:**

| Stage | Unit Tests | BDD Tests |
|-------|-----------|-----------|
| **Local Dev** | ✅ Watch mode | ⏸️ On demand |
| **Pre-Commit** | ✅ Required | ❌ Skip |
| **Pull Request** | ✅ Required | ✅ Required |
| **Main Branch** | ✅ Always | ✅ Always |

**Benefits:**
- Fast developer feedback loop
- Reduced CI costs
- Clear failure signals (unit = logic, BDD = integration)

---

## Troubleshooting

**"No scenarios found"**
- Run from `backend/` directory: `cd backend && npm run test:bdd`

**"Relation 'users' does not exist"**
- Ensure PostgreSQL running: `docker compose ps`
- Migrations run automatically in `startServer()`

**"Ambiguous step definitions"**
- Use feature-specific step names (see Exercise 5.2 patterns)

**Process hangs after tests**
- Already fixed via `AfterAll` hook with delayed exit

---

## Project Structure

```
backend/src/__tests__/bdd/
├── features/              # Exercise 5.1 - Gherkin scenarios
│   ├── user_registration.feature
│   ├── task_management.feature
│   └── group_management.feature
├── steps/                 # Exercise 5.2 - Step definitions
│   ├── userRegistration.steps.ts
│   ├── taskManagement.steps.ts
│   └── groupManagement.steps.ts
├── support/               # Exercise 5.3 - Infrastructure
│   ├── world.ts           # Shared state
│   └── hooks.ts           # Lifecycle management
└── reports/
    └── cucumber-report.html
```

---

## Dependencies

```json
{
  "@cucumber/cucumber": "^12.2.0",
  "@types/chai": "^5.2.3",
  "chai": "^6.2.0",
  "supertest": "^7.1.4",
  "ts-node": "^10.9.2"
}
```


[GitHub Actions](https://github.com/To-Kar/studyconnect/actions/workflows/tests.yml) | [Cucumber Docs](https://github.com/cucumber/cucumber-js)

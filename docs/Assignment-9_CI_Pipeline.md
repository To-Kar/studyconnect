## Ex 9.1
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

**Explanations:**  

We chose the "push to main"-trigger, as we use the other branches for quick changes and after a exercise is done we merge it to the main branch. So the CI-Pipeline is the final step before shipping the software.

---
## Ex 9.2

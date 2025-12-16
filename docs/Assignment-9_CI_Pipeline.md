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
1. Go to [GitHub Actions](https://github.com/To-Kar/studyconnect/actions/workflows/tests.yml). You need to be logged in to see all the relevant items.
2. Expand "Run BDD tests" step
3. Download `cucumber-report` artifact

**Explanations:**  

We chose the "push to main"-trigger, as we use the other branches for quick changes and after a exercise is done we merge it to the main branch. So the CI-Pipeline is the final step before shipping the software.


## Ex 9.2
**File:** `.github/workflows/npm-audit.yml`

**Workflow/Explanations:**

Uses the bash shell on a amd64-linux runner to run `npm audit`, a tool which shows vulnerabilities in the projects dependencies. Before this it runs `npm audit signatures` which checks the signatures of the files downloaded from the npm registry. We did not use the artifacts option from GH actions, as this is extra work (download zipfile, extract...) when reviewing the output of the workflow.

The added value is at first, that we can be sure that the used npm dependencies are not tampered by checking the signatures. As a second point we get informed about the vulnerabilities in our project. As the fixing process can create additional problems we decided to not do this automatically.

**Triggers:**
- Push to any branch
- Manual dispatch

**Viewing results:**
1. Go to [GitHub Actions](https://github.com/To-Kar/studyconnect/actions/workflows/npm-audit.yml). You need to be logged in to see all the relevant items.
2. Select the latest workflow run or if you just want to see any vulnerabilities select the latest workflow run which is indicated with an red (x)
3. Click on the audit-button to see the output of the console commands. A red (X) indicates that there was an error or that there are vulnerabilities present. Click on it to view the details
4. To fix the vulnerabilities run `npm audit fix` in the projects folder locally


## Ex 9.3
**File:** `.github/workflows/build.yml`

**Workflow:**
After creating the project on the sonarqube server and creating the required tokens this task was mainly copy and paste from the tutorial at sonarqube. We changed the given .yml-file to run regarding the branches, as testing is easier if the runner gets active every time our ex9-branch is updated.


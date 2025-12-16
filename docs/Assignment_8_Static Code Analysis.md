## Exercise 8.1  
As we are programming in typescript we need to use typescript-eslint as our linter.  
### Installation
Works as described in `https://typescript-eslint.io/getting-started/`  

#### Step 1:
Open a terminal in the projects `backend` folder. All following commands need to be run there.  

Install the eslint package as a development dependency by executing `npm install --save-dev eslint @eslint/js typescript typescript-eslint`

#### Step 2:
Create config file `eslint.config.mjs` and populate the file with:
```bash
// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
);
```

#### Step 3:  
Run the linter by executing `npx eslint .`  

Eslint will now print the found problems sorted by filename.  

### Reflection
As there are in total 204 problems found by eslint by the time of writing, it is probably a very good idea to have the code checked like this. It would have been better if we had integrated such linter in a earlier stage of the project to not sum up so many problems.


## Exercise 8.2
### Configuration
The testing suite we use is jest and the suite also includes a code coverage checker. We just need to enable it by adding the line `collectCoverage: true,` in the jest config file `backend/jest.config.js`

What we also need to add is a configuration regarding the test coverage we want to achieve. This is done by adding the coverageThreshold option in the jest config file.
```bash
coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
```
By adding this configuration option jest will fail if it determines a coverage below 80% for branches, lines and functions or if there are > 10 uncovered statements.

### Running the coverage checks
The code coverage is automatically tested when running `npm test`. As an alternative the command `npx jest --coverage` forces jest to do the coverage tests. This should not be needed as we set coverage checks to default under `Configuration`.

### Analyzing code coverage
Code coverage of our tests can be seen in the terminal window running the test suite. Better for a detailed analysis is the coverage report which is located at `/backend/coverage/index.html`

### Reflection
It is a bit disappointing to see such little coverage percentages but it's probably better to know that not all code is covered than to rely on false assumptions.


## Exercise 8.3
### Installation & Configuration
Open a terminal in the projects `backend` folder. All following commands need to be run there.

At first we need to install the packages by executing `npm install --save-dev husky lint-staged`

Then we configure `lint-staged` in `package.json` to run eslint on TypeScript files:
```json
"lint-staged": {
  "*.ts": "eslint"
}
```

We also add a prepare script to `package.json` to ensure husky is installed automatically:
```json
"scripts": {
  "prepare": "cd .. && husky backend/.husky"
}
```

Finally, we initialize husky and create the pre-commit hook:
```bash
npm run prepare
echo "cd backend && npx lint-staged" > .husky/pre-commit
```
Now, every time we commit, `lint-staged` will run eslint on the changed files. If there are errors, the commit will be aborted.
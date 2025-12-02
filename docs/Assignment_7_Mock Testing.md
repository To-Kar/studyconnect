## Exercise 7.1  
As we develop a sort of a social media platform we decided to mainly use the "Use Case" test design technique. The use cases were described in Assignment 2.  
Everything the application needs is written down in a use case. So if all use cases are tested, the whole application is tested. Problem in our particular  
case is, that we did not implement all use cases.

### Tests Added
- `backend/src/__tests__/dataStoreExtras.test.ts`
  - Task comments: create/retrieve/delete per task.
  - Notifications: create, unread filter, sorting, mark-as-read, other-user isolation.
  - Audit logs: create and filter by entity.
  - `updateManyTasks`: verifies only matching tasks update.
  - Badge thresholds: first_task, task_master (10), century (100 pts), unknown user.
- `backend/src/__tests__/controllerExtras.test.ts`
  - ICS export: headers and VCALENDAR content with due tasks.
  - Task comments controllers: add/list/delete, missing comment error.
  - Notifications controllers: list (unreadOnly), create (defaults to current user), mark-as-read.

## Exercise 7.2: Service Testing (UserService)

Implemented `UserService` and its unit tests using Jest mocks to isolate business logic from the database.

### Implementation
- **UserService**: Created a service layer to handle user operations.
  - **Registration**: Validates password length (>6 chars) and checks for existing users before creation.
  - **Login**: Verifies email existence and password matching.
  - **Role Assignment**: Automatically assigns `Role.USER` to new registrations.

### Testing Strategy
- **Mocking**: Used `jest.mock` to replace `dataStore` dependency.
- **Scenarios Verified**:
  1.  **Successful Registration**: Verifies `createUser` is called with correct data.
  2.  **Validation Errors**: Ensures short passwords throw "Password too short".
  3.  **Duplicate Handling**: Ensures existing users throw "User already exists".
  4.  **Login Flow**: Verifies successful login and invalid credential rejection.


## Exercise 7.3
Requirements: working Docker Desktop installation as described in `https://docs.docker.com/get-started/introduction/get-docker-desktop/`  
There is a new dependency (testcontainers) and because of this its required to run `npm install` initially. The methods needed for communication with the database are in the file `backend/src/lib/databaseService.ts`
while the corresponding tests are located at `backend/src/__tests__/databaseService.test.ts`

## Exercise 7.4: REST API Controller

Implemented the REST API layer acting as the entry point for HTTP requests, following the 3-tier architecture (Controller ↔ Service ↔ DataStore) requirements.

### Implementation
- **Controllers**: Implemented RESTful controllers in `backend/src/controllers/` handling input validation, HTTP status codes, and response formatting.
  - **Auth Controller**: Handles `register` (with password hashing), `login` (returning JWT tokens), and password reset flows.
  - **User Controller**: Manages user profile retrieval and updates via `getUserById` and `updateUser`.
  - **Task Controller**: Implements full CRUD operations for tasks (Create, Read, Update, Delete) and handles assignment logic.
- **Service Integration**: Integrated the `UserService` into the authentication flow to decouple business logic from the HTTP layer.
- **Server Infrastructure**: Updated `backend/src/server.ts` to ensure the server waits for database migrations and seeding before accepting connections.

### API Endpoints
The following endpoints are now available under `http://localhost:3000/api`:
- **Authentication**: `/auth/register`, `/auth/login`, `/auth/reset`
- **Users**: `/users/:id` (GET, PUT)
- **Tasks**: `/tasks` (GET, POST), `/tasks/:id` (PUT, DELETE)

### Execution
To run the API locally:
1. Start the database: `docker-compose up -d`
2. Start the backend: `npm run dev`




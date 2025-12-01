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
Requirement: working Docker Desktop installation as described in https://docs.docker.com/get-started/introduction/get-docker-desktop/


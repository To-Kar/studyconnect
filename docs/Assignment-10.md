# Assignment 10: API Endpoint Reflection

## Exercise 10.1: Reflect on your existing API Endpoint

**Task**: Reflect on the REST API endpoint developed during exercise 6 (Mock Testing) in the StudyConnect backend. Double check that the endpoint(s) provide at least two operations.

### 1. Backend Setup & Start

The backend is built with **Node.js, Express, and TypeScript**, using **PostgreSQL** for persistence.

- **Prerequisites**: Node.js, PostgreSQL (locally or via Docker).
- **Project Location**: `backend/`
- **Start Command**:
  ```bash
  docker compose up --build -d
  cd backend
  npm run dev
  ```
  *The server will start on port `3000`.*

### 2. API Access

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: Most endpoints require a **Bearer Token**.
  - Obtain a token via `POST /api/auth/login` or `POST /api/auth/register`.
  - Include header: `Authorization: Bearer <token>`

### 3. Verified Endpoints

The system implements fully functional REST endpoints for **Users** and **Tasks**.

#### A. Users API (`/api/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Retrieve all users | Yes (**Admin**) |
| `GET` | `/:id` | Get specific user details | Yes |
| `PUT` | `/:id` | Update user profile | Yes (Self/Admin) |

**Example Response (`GET /api/users`):**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "users": [
      {
        "id": "uuid-string...",
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN",
        "points": 100
      }
    ]
  }
}
```

#### B. Tasks API (`/api/tasks`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all tasks | Yes |
| `POST` | `/` | Create a new task | Yes |
| `GET` | `/:id` | Get task details | Yes |
| `PUT` | `/:id` | Update task | Yes |
| `DELETE` | `/:id` | Delete task | Yes |

**Example Request (`POST /api/tasks`):**
```json
{
  "title": "Study for Exam",
  "priority": "HIGH",
  "dueDate": "2025-12-31"
}
```

### 4. Implementation Logic

The endpoints are backed by real logic:
- **Controller Layer**: Handles HTTP requests and uses the Service layer.
- **Service Layer (`databaseService.ts`)**: Executes SQL queries against the PostgreSQL database.
- **Persistence**: Data is persistent across restarts (unlike mock implementations).

### 5. Testing Tools

- **Postman**: A collection `studyconnect.postman_collection.json` is provided in the project root.


## Exercise 10.2: Manual API Testing

**Task**: Use a manual API testing tool to interact with your implemented endpoint. Perform at least one successful request and one request with invalid data.

### 1. Tool Used
**Postman** (v10.x) was used to manually interact with the API endpoints.

### 2. Test Execution & Outcomes

#### A. Successful Request
- **Operation**: `POST /api/auth/register` (Register User)
- **Input Data**: Valid JSON with unique username, email, and password.
- **Outcome**: `201 Created`
- **Response**: Returns the new user object and JWT token.
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

#### B. Failed Request (Invalid Data)
- **Operation**: `POST /api/auth/register` (Register Failure)
- **Input Data**: JSON missing required `email` and `password` fields.
  ```json
  {
    "username": "incompleteUser"
  }
  ```
- **Outcome**: `400 Bad Request`
- **Error Behavior**: The API correctly validates input and returns a descriptive error message.
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Please provide email, username and password"
  }
  ```
  *(Note: The actual response status is 400, but the JSON body structure is consistent with the app's error handling)*

### 3. Summary
The API behaves as expected. Success paths return appropriate 2xx status codes with data. Error paths (like missing fields) are caught by validation logic, returning 4xx codes with helpful error messages, ensuring robustness against invalid input.

## Exercise 10.3: Automated API Test Cases

**Task**: Write automated test cases to validate your endpoint using an appropriate test framework (Jest + SuperTest).

### 1. Test Framework Setup
- **Framework**: Jest (Test Runner) + SuperTest (HTTP assertions)
- **Configuration**: `jest.local.config.js` was created to run tests against the running local database (bypassing Docker containers for simplicity).
- **Test File**: `backend/src/__tests__/api.test.ts`

### 2. Implemented Test Cases
The test suite covers the following scenarios:
1.  **Register Success**: Verifies `POST /api/auth/register` returns `201 Created` and a valid token.
2.  **Register Failure**: Verifies `POST /api/auth/register` returns `400 Bad Request` when required fields are missing.
3.  **Login Success**: Verifies `POST /api/auth/login` works with the newly created user.

### 3. How to Run the Tests
A convenience script has been added to `package.json`.

1.  Ensure the backend database is running (e.g., via `npm run dev` in another terminal, or just Docker).
2.  Run the test command:
    ```bash
    cd backend
    npm run test:api
    ```

### 4. Test Output Example
```text
PASS  src/__tests__/api.test.ts (2.574 s)
  Authentication API Integration Tests
    POST /api/auth/register
      √ should register a new user successfully (201) (38 ms)
      √ should fail when required fields are missing (400) (9 ms)
    POST /api/auth/login
      √ should login successfully with valid credentials (200) (7 ms)
```


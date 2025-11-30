# 7.1  
As we develop a sort of a social media platform we decided to mainly use the "Use Case" test design technique. The use cases were described in Assignment 2.  
Everything the application needs is written down in a use case. So if all use cases are tested, the whole application is tested. Problem in our particular  
case is, that we did not implement all use cases.

## Tests Added
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


# 7.3
The methods needed are in /lib/databaseService.ts
- Creating a new user -> createUser
- Finding a user by ID -> findUserById
- Finding a user by email -> findUserbyEmail
- Updating user information -> updateUser
- Deleting a user -> deleteUser
- Querying users by role -> queryUserByRole
- Querying users by team membership -> findGroupMembersByGroupId


# Exercise 2.1 – Functional System Requirements

## 1. User Management
- The system shall allow users to register and log in securely.  
- The system shall allow users to create, edit, and delete their profiles.  
- The system shall allow users to join or leave study groups.  
- The system shall allow group administrators to invite or remove members.  
- The system shall distinguish between group members and administrators with different permissions.  

## 2. Task and Goal Management
- The system shall allow users to create, edit, and delete personal tasks.  
- Each task shall include a title, description/notes, due date, and priority level.  
- The system shall allow users to categorize tasks (e.g., “Mathematics,” “Exam Prep”).  
- Each task shall have a progress state: open, in progress, or completed.  
- The system shall display a list of all tasks with sorting and filtering options.  
- The system shall allow exporting tasks and schedules as PDF and ICS files.  

## 3. Group Collaboration
- The system shall allow users to create study groups.  
- The system shall allow group administrators to assign tasks to members.  
- The system shall provide a commenting and messaging function tied to specific tasks.  
- The system shall allow members to update the progress of shared group tasks.  
- The system shall allow viewing all tasks and responsibilities within a group.  

## 4. Deadline and Progress Awareness
- The system shall display upcoming and overdue tasks.  
- The system shall highlight tasks based on their urgency.  
- The system shall provide non-intrusive reminders or notifications for deadlines.  
- The system shall visualize progress (e.g., progress bars, completion percentages).  

## 5. Motivation and Gamification
- The system shall award progress points or badges for completing tasks.  
- The system shall allow users to view their achievements and progress statistics.  
- The system shall ensure gamification elements do not interfere with task functionality.  

## 6. Accessibility and Integration
- The system shall be available as a web application across devices.  
- The system shall synchronize user data across all supported devices.  
- The system shall allow exporting data to external formats (PDF, ICS).  
- The system shall support modular extensions for future integrations with learning platforms or institutional systems.

# Exercise 2.2 - Quality Model



# Exercise 2.3 - System Context & Use Cases

## 1. System Context Diagram
```mermaid LR
%% System Context Diagram — StudyConnect

classDef actor fill:#fff,stroke:#333,stroke-width:1.5px;
classDef external fill:#fffaf0,stroke:#8a6d3b,stroke-dasharray:5 3,stroke-width:1.5px;
classDef system fill:#eef7ff,stroke:#2b6cb0,stroke-width:2px;

SC[[StudyConnect]]:::system

Student((Student)):::actor
Admin((Group Admin)):::actor
Time((Time Event)):::actor
Calendar[(Calendar App)]:::external
Notify[(Email/Push Service)]:::external

%% Labeled, directed flows
Student -- "Create/Edit tasks, add comments" --> SC
SC -- "Display task lists, comments, progress" --> Student

Admin -- "Manage groups, assign tasks" --> SC
SC -- "Provide group and member status" --> Admin

Time -- "Deadline reached" --> SC
SC -- "Mark task as overdue" --> SC

SC -- "Export ICS file" --> Calendar
SC -- "Send reminders/notifications" --> Notify
```

## 2. Use Case Diagram - Task Management
```flowchart TD
%% Use Case Diagram — StudyConnect / Task Management

classDef actor fill:#fff,stroke:#333,stroke-width:1.5px;
classDef uc fill:#f0f7ff,stroke:#2b6cb0,stroke-width:1.5px;

Student((Student)):::actor
Admin((Group Admin)):::actor
Time((Time Event)):::actor

subgraph SC[StudyConnect]
  CT([Create Task]):::uc
  ET([Edit Task]):::uc
  DT([Delete Task]):::uc
  CAT([Categorize Task]):::uc
  PR([Set Priority]):::uc
  DD([Set Deadline]):::uc
  ST([Update Progress]):::uc
  VF([View / Filter / Sort Tasks]):::uc
  RM([Show Upcoming / Overdue Tasks]):::uc
  EXU([Export Tasks or Schedule]):::uc
  AS([Assign Task to Member]):::uc
  CMU([Comment on Task]):::uc
  REM([Send Reminder]):::uc
  OVR([Mark Task as Overdue]):::uc
end

style SC fill:#f7fbff,stroke:#2b6cb0,stroke-width:2px

%% Associations
Student --- CT
Student --- ET
Student --- DT
Student --- CAT
Student --- PR
Student --- DD
Student --- ST
Student --- VF
Student --- RM
Student --- EXU
Student --- CMU

Admin --- AS
Admin --- CT
Admin --- ET
Admin --- VF
Admin --- RM
Admin --- CMU

Time --- REM
Time --- OVR

%% Includes/Extends (Labels per |text|)
CT -.->|<<include>>| DD
CT -.->|<<include>>| PR
CT -.->|<<include>>| CAT
CT -.->|<<include>>| ST
VF -.->|<<include>>| EXU
RM -.->|<<extend>> when deadline approaching or overdue| VF
```

## 3. Use cases

### Use Case: UC-01 — Create Task

#### Name:
Create Task

#### Summary:
The user creates a new task with a title, optional notes, category, priority, and due date so that it appears in their (or the group’s) backlog and can be tracked and managed.

#### Actor:
- Student (primary)
- Group Admin (secondary)

#### Triggering Event:
The user selects **“New Task”** from the task management interface.

#### Inputs:
- Title (required)  
- Notes (optional)  
- Category (optional)  
- Priority (optional)  
- Due date (optional)

#### Pre-Conditions:
- The user is authenticated and has permission to create tasks in the selected group or personal workspace.  
- The task view is loaded.

#### Process Description:
1. The system displays the **task creation form**.
2. The actor fills in all relevant fields and submits the form.
3. The system validates the input fields (title required, valid due date).
4. The system creates a new task with default status **Open** and assigns metadata (owner/group).
5. The system returns a success confirmation and displays the task in the task list.

#### Exceptions:
- **3a.** Missing or invalid input → System highlights invalid fields and displays an error message.  
- **4a.** Database/persistence error → System displays an error message; task is not created.

#### Outputs and Post-Conditions:
- A new task entity exists in the system with a unique ID.
- The task appears in the user’s or group’s task list.
- The due date can later trigger reminder or overdue events.

#### Figures:
- Use Case Diagram: *Task Management (Create Task)*  
- Sequence Diagram: *Create Task*

#### Further Supporting Material:
- Related Use Case: **Assign Task to Member**
- Related Feature: **Deadline Awareness**

### Use Case: UC-02 — Assign Task to Member

#### Name:
Assign Task to Member

#### Summary:
The group admin assigns an existing task to a specific group member to clarify responsibilities and ensure the member sees the task in their dashboard.

#### Actor:
- Group Admin

#### Triggering Event:
The admin selects a task from the group task board and chooses the **“Assign”** option.

#### Inputs:
- Task ID (selected task)  
- Target member (user ID or username)

#### Pre-Conditions:
- The admin is authenticated and has administrative privileges in the group.
- The selected task exists and is accessible to the admin.

#### Process Description:
1. The system displays a list of group members eligible for assignment.
2. The actor selects a member and confirms the assignment.
3. The system validates membership and permission of the selected user.
4. The system updates the task’s assignment field and stores the change.
5. The system notifies the assigned member (via in-app message or email if enabled).

#### Exceptions:
- **3a.** The selected user is not part of the group → System displays an error and cancels the operation.  
- **4a.** Database or notification failure → System logs the error and informs the admin.

#### Outputs and Post-Conditions:
- The task record is updated with a new assignee.
- The assignee can view the task in their personal dashboard.
- Optional notification sent to the assignee.

#### Figures:
- Use Case Diagram: *Task Management (Assign Task)*

#### Further Supporting Material:
- Related Use Case: **Create Task**
- Related Feature: **Group Collaboration**

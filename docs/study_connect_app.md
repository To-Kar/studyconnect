# StudyConnect Application

This document outlines the initial expectations and context for the development of StudyConnect.

## Purpose and Scope
StudyConnect helps students capture, organize, and monitor their learning commitments while enabling lightweight collaboration within study groups. It is a student-centered productivity tool used for educational purposes in the Software Testing course.

## Target Users and Context
- Individual students planning homework, exam preparation, and project milestones
- Small study groups coordinating shared work and preparing for exams together

## Core Features

### Personal task and goal management
- Create tasks with title, deadline, priority, notes
- Categorize tasks (e.g., “Mathematics,” “Exam Prep,” “Group Project”)
- Track progress states (e.g., open, in progress, completed)
- Maintain a clear overview of parallel learning goals

### Study groups and collaboration
- Create or join groups, invite members, and assign tasks
- Support basic moderation by group administrators
- Keep discussions close to work via task-linked comments and messaging

### Deadlines and awareness
- Link tasks and group activities to specific dates
- Highlight upcoming and overdue work
- Provide supportive (non-intrusive) reminders/notifications

### Motivation and exports
- Offer engagement elements (e.g., progress points or badges)
- Export schedules and plans to PDF or calendar files (ICS)

## Architecture and Platform Principles
- Lightweight and modular design to remain manageable and extensible
- Accessible across web, mobile, and potentially desktop platforms
- Enable future integrations with external learning platforms or institutional systems

## Non-Goals
StudyConnect is not intended to be a full project management suite. The focus is on simplicity, student needs, and collaboration at small scale.

## High-Level Expectations (for requirements engineering)
1. Simplicity and Usability
   - Provide an intuitive UI allowing quick task creation and management without prior training.
2. Support for Individual and Group Task Management
   - Enable organizing and monitoring personal tasks and collaborating within groups.
3. Role- and Permission Management
   - Distinguish between members and administrators for clear assignment and moderation.
4. Awareness of Deadlines and Progress
   - Reflect progress states and deadlines clearly to support prioritization and time management.
5. Motivation and Engagement
   - Include positive reinforcement without distracting from learning objectives.
6. Accessibility and Integration
   - Ensure cross-device accessibility and support exports (PDF, ICS) for workflow integration.

## Overall Architecture

### Technology Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (via Docker)
- Styling: TailwindCSS
- Development: Docker Compose for local development








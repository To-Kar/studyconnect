Feature: Task Management
  As an authenticated user
  I want to manage tasks
  So that I can track my work in StudyConnect

  Background:
    Given the StudyConnect API is running
    And I am an authenticated user

  Scenario: Create a new task
    When I create a task with title "BDD Task" and priority "HIGH"
    Then the task should be created with status 201
    And the task response should have title "BDD Task" and priority "HIGH"

  Scenario: Complete a task awards points
    Given I have a task titled "Award Points Task"
    When I mark the task as DONE
    Then the task update should succeed with status 200
    And the user should receive points for completion

  Scenario: Edit an existing task
    Given I have a task titled "BDD Task"
    When I update the task title to "Updated BDD Task"
    And I change the priority to "LOW"
    Then the task update should succeed with status 200
    And the task response should have title "Updated BDD Task" and priority "LOW"

  Scenario: Delete a task
    Given I have a task titled "Obsolete Task"
    When I delete the task
    Then the task deletion should succeed with status 200
    And the task should no longer be in my task list

  Scenario: Filter tasks by priority
    Given I have multiple tasks with different priorities
    When I filter tasks by priority "HIGH"
    Then only tasks with priority "HIGH" are displayed

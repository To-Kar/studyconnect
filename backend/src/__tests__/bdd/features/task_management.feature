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

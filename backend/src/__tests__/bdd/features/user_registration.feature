Feature: User Registration
  As a new visitor
  I want to create an account
  So that I can start using StudyConnect

  Background:
    Given the StudyConnect API is running

  Scenario: Successful user registration
    When I register with a unique email and username
    Then the registration should succeed with status 201
    And the response should include my user id and username

  Scenario: Registration with existing email
    When I attempt to register with an email that already exists
    Then the registration should fail with status 409
    And the response body should contain an error message "User with this email or username already exists"

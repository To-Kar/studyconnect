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

  Scenario: Successful user login
    Given I have an existing user account with username "user1"
    When I enter the correct username and password
    Then I should be logged in
    And the dashboard is displayed

  Scenario: User login with incorrect password
    Given I have an existing user account with username "user1"
    When I enter the correct username but incorrect password
    Then the login should fail with status 401
    And an error message "Invalid credentials" is shown

  Scenario: Password reset request
    Given I have forgotten my password
    When I request a password reset for my email "user1@example.com"
    Then an email with password reset instructions should be sent

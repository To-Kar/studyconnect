Feature: Group Management
  As a user
  I want to organize into groups
  So that I can collaborate with others

  Background:
    Given the StudyConnect API is running
    And I am an authenticated user

  Scenario: Create a new group
    When I create a group named "BDD Group"
    Then the group creation should return status 201
    And the group response should include name "BDD Group"

  Scenario: Join an existing group variant
    Given there is an existing group named "Joinable Group" created by another user
    When I join that group
    Then joining the group should return status 201
    And I should be a member of that group

  Scenario: Leave a group
    Given I am a member of group "BDD Group"
    When I leave the group
    Then I should no longer be a member of "BDD Group"
    And the operation should return status 200

  Scenario: Join a non-existing group
    When I attempt to join a group named "NonExistentGroup"
    Then the operation should fail with status 404
    And the response should include an error message "Group not found"

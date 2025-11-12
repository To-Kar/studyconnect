import { Given, When, Then, And } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import * as assert from "assert";

Given("the StudyConnect API is running", function (this: CustomWorld) {
  console.log("API wird als laufend angenommen.");
});

When("I register with a unique email and username", async function (this: CustomWorld) {
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const username = `testuser_${Date.now()}`;
  const body = {
    email: uniqueEmail,
    username: username,
    password: "secure123",
  };
  this.lastResponse = await this.apiClient.post("/register", body);
});

Then("the registration should succeed with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the response should include my user id and username", function (this: CustomWorld) {
  assert.ok(this.lastResponse.data.userId, "Antwort enthält keine userId");
  assert.ok(this.lastResponse.data.username, "Antwort enthält keinen username");
});

When("I attempt to register with an email that already exists", async function (this: CustomWorld) {
  const body = {
    email: "existing@example.com",
    username: "newuser",
    password: "secure123",
  };
  this.lastResponse = await this.apiClient.post("/register", body);
});

Then("the registration should fail with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the response body should contain an error message {string}", function (this: CustomWorld, expectedMessage: string) {
  assert.strictEqual(this.lastResponse.data.message, expectedMessage);
});

Given("I have an existing user account with username {string}", function (this: CustomWorld, username: string) {
  // Setup: Stellt sicher, dass dieser Benutzer existiert.
  this.username = username;
});

When("I enter the correct username and password", async function (this: CustomWorld) {
  const body = { username: this.username, password: "correct-password" };
  this.lastResponse = await this.apiClient.post("/login", body);

  if (this.lastResponse.status === 200) {
    this.apiClient.setAuthToken(this.lastResponse.data.token);
  }
});

Then("I should be logged in", function (this: CustomWorld) {
  assert.ok(this.apiClient.getAuthToken(), "Auth-Token wurde nach dem Login nicht gesetzt");
});

And("the dashboard is displayed", function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 200);
});

When("I enter the correct username but incorrect password", async function (this: CustomWorld) {
  const body = { username: this.username, password: "incorrect-password" };
  this.lastResponse = await this.apiClient.post("/login", body);
});

Then("the login should fail with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("an error message {string} is shown", function (this: CustomWorld, expectedMessage: string) {
  assert.strictEqual(this.lastResponse.data.message, expectedMessage);
});

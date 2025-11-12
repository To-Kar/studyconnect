import { Given, When, Then, And } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import * as assert from "assert";

Given("I am an authenticated user", async function (this: CustomWorld) {
  // Stellt sicher, dass ein Token vorhanden ist, sonst führt einen Login durch
  if (!this.apiClient.getAuthToken()) {
    const body = { username: "testuser", password: "password" };
    const response = await this.apiClient.post("/login", body);
    this.apiClient.setAuthToken(response.data.token);
  }
  assert.ok(this.apiClient.getAuthToken(), "Authentifizierung fehlgeschlagen");
});

When("I create a task with title {string} and priority {string}", async function (this: CustomWorld, title: string, priority: string) {
  const body = { title, priority };
  this.lastResponse = await this.apiClient.post("/tasks", body);
  
  if (this.lastResponse.status === 201) {
    this.lastTaskId = this.lastResponse.data.id;
  }
});

Then("the task should be created with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the task response should have title {string} and priority {string}", function (this: CustomWorld, title: string, priority: string) {
  assert.strictEqual(this.lastResponse.data.title, title);
  assert.strictEqual(this.lastResponse.data.priority, priority);
});

Given("I have a task titled {string}", async function (this: CustomWorld, title: string) {
  // Setup-Schritt: Erstellt die Task
  const body = { title, priority: "MEDIUM" };
  const response = await this.apiClient.post("/tasks", body);
  assert.strictEqual(response.status, 201);
  this.lastTaskId = response.data.id;
});

When("I mark the task as DONE", async function (this: CustomWorld) {
  const body = { status: "DONE" };
  this.lastResponse = await this.apiClient.put(`/tasks/${this.lastTaskId}`, body);
});

Then("the task update should succeed with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the user should receive points for completion", async function (this: CustomWorld) {
  const response = await this.apiClient.get("/me");
  assert.ok(response.data.points > 0, "Benutzer hat keine Punkte erhalten");
});

When("I update the task title to {string}", function (this: CustomWorld, newTitle: string) {
  this.newTitle = newTitle;
});

And("I change the priority to {string}", async function (this: CustomWorld, newPriority: string) {
  const body = { title: this.newTitle, priority: newPriority };
  this.lastResponse = await this.apiClient.put(`/tasks/${this.lastTaskId}`, body);
});

// Edit task scenario
When('I update the task title to {string}', async function(this: CustomWorld, newTitle: string) {
  this.lastResponse = await request(app)
    .put(`/api/tasks/${this.currentTaskId}`)
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title: newTitle });
});

When('I change the priority to {string}', async function(this: CustomWorld, priority: string) {
  this.lastResponse = await request(app)
    .put(`/api/tasks/${this.currentTaskId}`)
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ priority });
});

// Delete task scenario
When('I delete the task', async function(this: CustomWorld) {
  this.lastResponse = await request(app)
    .delete(`/api/tasks/${this.currentTaskId}`)
    .set('Authorization', `Bearer ${this.authToken}`);
});

Then('the task deletion should succeed with status {int}', function(this: CustomWorld, status: number) {
  // Accept 200 or 204 (No Content)
  expect([200, 204]).to.include(this.lastResponse!.status);
});

Then('the task should no longer be in my task list', async function(this: CustomWorld) {
  const res = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`);
  const tasks = res.body.data.tasks;
  const found = tasks.find((t: any) => t.id === this.currentTaskId);
  expect(found).to.be.undefined;
});

// Filter tasks scenario
Given('I have multiple tasks with different priorities', async function(this: CustomWorld) {
  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title: 'High Priority Task', priority: 'HIGH' });
  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title: 'Medium Priority Task', priority: 'MEDIUM' });
  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title: 'Low Priority Task', priority: 'LOW' });
});

When('I filter tasks by priority {string}', async function(this: CustomWorld, priority: string) {
  this.lastResponse = await request(app)
    .get(`/api/tasks?priority=${priority}`)
    .set('Authorization', `Bearer ${this.authToken}`);
});

Then('only tasks with priority {string} are displayed', function(this: CustomWorld, priority: string) {
  expect(this.lastResponse!.status).to.equal(200);
  const tasks = this.lastResponse!.body.data.tasks;
  expect(tasks.length).to.be.greaterThan(0);
  tasks.forEach((task: any) => {
    expect(task.priority).to.equal(priority);
  });
});

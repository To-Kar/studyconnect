import { Given, When, Then } from "@cucumber/cucumber";
import chai from "chai";
import request from "supertest";
import app from "../../../app";
import { CustomWorld } from "../support/world";
const expect = chai.expect;

Given('I am an authenticated user', async function(this: CustomWorld) {
  const unique = Date.now();
  const reg = await request(app).post('/api/auth/register').send({
    email: `auth_${unique}@example.com`,
    username: `auth_${unique}`,
    password: 'Password123!'
  });
  const login = await request(app).post('/api/auth/login').send({
    email: reg.body.data.user.email,
    password: 'Password123!'
  });
  this.authToken = login.body.data.token;
  expect(this.authToken).to.be.a('string');
});

When('I create a task with title {string} and priority {string}', async function(this: CustomWorld, title: string, priority: string) {
  this.lastResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title, priority });
  this.currentTaskId = this.lastResponse!.body.data.task.id;
});

Then('the task should be created with status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('the task response should have title {string} and priority {string}', function(this: CustomWorld, title: string, priority: string) {
  expect(this.lastResponse!.body.data.task.title).to.equal(title);
  expect(this.lastResponse!.body.data.task.priority).to.equal(priority);
});

Given('I have a task titled {string}', async function(this: CustomWorld, title: string) {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ title, priority: 'MEDIUM' });
  this.currentTaskId = res.body.data.task.id;
});

When('I mark the task as DONE', async function(this: CustomWorld) {
  this.lastResponse = await request(app)
    .put(`/api/tasks/${this.currentTaskId}`)
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ status: 'DONE' });
});

Then('the task update should succeed with status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('the user should receive points for completion', function(this: CustomWorld) {
  expect(this.lastResponse!.body.data.pointsAwarded).to.equal(true);
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

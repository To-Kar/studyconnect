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

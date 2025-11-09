import { When, Then, Given } from "@cucumber/cucumber";
import chai from "chai";
import request from "supertest";
import app from "../../../server";
import { CustomWorld } from "../support/world";
const expect = chai.expect;

let existingEmail = `existing_${Date.now()}@example.com`;

Given('the StudyConnect API is running', async function(this: CustomWorld) {
  const res = await request(app).get('/');
  expect(res.status).to.equal(200);
});

When('I register with a unique email and username', async function(this: CustomWorld) {
  const unique = Date.now();
  this.lastResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email: `user_${unique}@example.com`,
      username: `user_${unique}`,
      password: 'Password123!'
    });
});

Then('the registration should succeed with status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('the response should include my user id and username', function(this: CustomWorld) {
  expect(this.lastResponse!.body.data.user.id).to.be.a('string');
  expect(this.lastResponse!.body.data.user.username).to.be.a('string');
});

When('I attempt to register with an email that already exists', async function(this: CustomWorld) {
  await request(app).post('/api/auth/register').send({
    email: existingEmail,
    username: `existing_${Date.now()}`,
    password: 'Password123!'
  });
  this.lastResponse = await request(app).post('/api/auth/register').send({
    email: existingEmail,
    username: `another_${Date.now()}`,
    password: 'Password123!'
  });
});

Then('the registration should fail with status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('the response body should contain an error message {string}', function(this: CustomWorld, _message: string) {
  expect(this.lastResponse!.body.message).to.equal('User with this email or username already exists');
});

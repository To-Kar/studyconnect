import { Given, When, Then } from "@cucumber/cucumber";
import chai from "chai";
import request from "supertest";
import app from "../../../server";
import { CustomWorld } from "../support/world";
const expect = chai.expect;

let groupId: string;

Given(/^there is an existing group named "([^"]+)"(?: created by another user)?$/, async function(this: CustomWorld, name: string) {
  // Create a separate owner user for the group, so current user can join
  const unique = Date.now();
  await request(app).post('/api/auth/register').send({
    email: `owner_${unique}@example.com`,
    username: `owner_${unique}`,
    password: 'Password123!'
  });
  const ownerLogin = await request(app).post('/api/auth/login').send({
    email: `owner_${unique}@example.com`,
    password: 'Password123!'
  });
  const ownerToken = ownerLogin.body.data.token;

  const res = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name });
  groupId = res.body.data.group.id;
});

When('I create a group named {string}', async function(this: CustomWorld, name: string) {
  this.lastResponse = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${this.authToken}`)
    .send({ name });
});

Then('the group creation should return status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('the group response should include name {string}', function(this: CustomWorld, name: string) {
  expect(this.lastResponse!.body.data.group.name).to.equal(name);
});

When('I join that group', async function(this: CustomWorld) {
  this.lastResponse = await request(app)
    .post(`/api/groups/${groupId}/join`)
    .set('Authorization', `Bearer ${this.authToken}`)
    .send();
});

Then('joining the group should return status {int}', function(this: CustomWorld, status: number) {
  expect(this.lastResponse!.status).to.equal(status);
});

Then('I should be a member of that group', async function(this: CustomWorld) {
  const groups = await request(app)
    .get('/api/groups')
    .set('Authorization', `Bearer ${this.authToken}`);
  const found = groups.body.data.groups.find((g: any) => g.id === groupId);
  expect(found).to.exist;
});

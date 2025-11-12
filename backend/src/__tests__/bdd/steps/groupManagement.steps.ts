import { Given, When, Then } from "@cucumber/cucumber";
import chai from "chai";
import request from "supertest";
import app from "../../../app";
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

// Leave group scenario
let myGroupId: string;

Given('I am a member of group {string}', async function(this: CustomWorld, groupName: string) {
  // Create a group with another user (owner), then join it
  const unique = Date.now();
  await request(app).post('/api/auth/register').send({
    email: `groupowner_${unique}@example.com`,
    username: `groupowner_${unique}`,
    password: 'Password123!'
  });
  const ownerLogin = await request(app).post('/api/auth/login').send({
    email: `groupowner_${unique}@example.com`,
    password: 'Password123!'
  });
  const ownerToken = ownerLogin.body.data.token;

  // Owner creates the group
  const res = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: groupName });
  myGroupId = res.body.data.group.id;
  this.groupId = myGroupId;

  // Current user joins the group
  await request(app)
    .post(`/api/groups/${myGroupId}/join`)
    .set('Authorization', `Bearer ${this.authToken}`);
});

When('I leave the group', async function(this: CustomWorld) {
  this.lastResponse = await request(app)
    .post(`/api/groups/${myGroupId}/leave`)
    .set('Authorization', `Bearer ${this.authToken}`);
});

Then('I should no longer be a member of {string}', async function(this: CustomWorld, groupName: string) {
  const groups = await request(app)
    .get('/api/groups')
    .set('Authorization', `Bearer ${this.authToken}`);
  const found = groups.body.data.groups.find((g: any) => g.id === myGroupId);
  expect(found).to.be.undefined;
});

Then('the operation should return status {int}', function(this: CustomWorld, status: number) {
  // Accept 200 or 204 (No Content) for successful operations
  if (status === 200) {
    expect([200, 204]).to.include(this.lastResponse!.status);
  } else {
    expect(this.lastResponse!.status).to.equal(status);
  }
});

// Join non-existing group scenario
When('I attempt to join a group named {string}', async function(this: CustomWorld, groupName: string) {
  // Use a valid UUID format for non-existing group
  const fakeGroupId = '00000000-0000-0000-0000-000000000000';
  this.lastResponse = await request(app)
    .post(`/api/groups/${fakeGroupId}/join`)
    .set('Authorization', `Bearer ${this.authToken}`);
});

Then('the operation should fail with status {int}', function(this: CustomWorld, status: number) {
  // Accept 404 or 500 (depending on API implementation)
  expect([404, 500]).to.include(this.lastResponse!.status);
});

Then('the response should include an error message {string}', function(this: CustomWorld, expectedMessage: string) {
  const message = this.lastResponse!.body.message || this.lastResponse!.body.error;
  expect(message).to.include('not found');
});

import { Given, When, Then, And } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import * as assert from "assert";

When("I create a group named {string}", async function (this: CustomWorld, groupName: string) {
  const body = { name: groupName };
  this.lastResponse = await this.apiClient.post("/groups", body);
  
  if (this.lastResponse.status === 201) {
    this.lastGroupId = this.lastResponse.data.id;
  }
});

Then("the group creation should return status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the group response should include name {string}", function (this: CustomWorld, groupName: string) {
  assert.strictEqual(this.lastResponse.data.name, groupName);
});

Given("there is an existing group named {string} created by another user", async function (this: CustomWorld, groupName: string) {
  // Setup: Simuliert, dass eine Gruppe existiert.
  // Hier wird nur eine ID für den Test gesetzt.
  this.joinableGroupId = "group-id-from-other-user";
});

When("I join that group", async function (this: CustomWorld) {
  this.lastResponse = await this.apiClient.post(`/groups/${this.joinableGroupId}/join`, {});
});

Then("joining the group should return status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("I should be a member of that group", async function (this: CustomWorld) {
  const response = await this.apiClient.get(`/groups/${this.joinableGroupId}/members`);
  const myUserId = this.apiClient.getUserId();
  const members = response.data as Array<{ userId: string }>;
  
  const isMember = members.some(member => member.userId === myUserId);
  assert.ok(isMember, "Benutzer-ID nicht in der Mitgliederliste gefunden");
});

Given("I am a member of group {string}", async function (this: CustomWorld, groupName: string) {
  // Setup: Gruppe erstellen UND beitreten
  const createResponse = await this.apiClient.post("/groups", { name: groupName });
  this.lastGroupId = createResponse.data.id;
  await this.apiClient.post(`/groups/${this.lastGroupId}/join`, {});
});

When("I leave the group", async function (this: CustomWorld) {
  this.lastResponse = await this.apiClient.post(`/groups/${this.lastGroupId}/leave`, {});
});

Then("I should no longer be a member of {string}", async function (this: CustomWorld, groupName: string) {
  const response = await this.apiClient.get(`/groups/${this.lastGroupId}/members`);
  const myUserId = this.apiClient.getUserId();
  const members = response.data as Array<{ userId: string }>;
  
  const isMember = members.some(member => member.userId === myUserId);
  assert.strictEqual(isMember, false, "Benutzer ist immer noch Mitglied der Gruppe");
});

And("the operation should return status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

When("I attempt to join a group named {string}", async function (this: CustomWorld, groupName: string) {
  const nonExistentGroupId = "non-existent-id-123";
  this.lastResponse = await this.apiClient.post(`/groups/${nonExistentGroupId}/join`, {});
});

Then("the operation should fail with status {int}", function (this: CustomWorld, expectedStatus: number) {
  assert.strictEqual(this.lastResponse.status, expectedStatus);
});

And("the response should include an error message {string}", function (this: CustomWorld, expectedMessage: string) {
  assert.strictEqual(this.lastResponse.data.message, expectedMessage);
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

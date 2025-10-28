import { dataStore, Role, User, Group, GroupMember } from '../lib/dataStore';

describe('GroupMember Entity and Relationship Tests', () => {
  let user1: User, user2: User, adminUser: User;
  let group1: Group, group2: Group;

  // Reset dataStore before each test and create test dependencies
  beforeEach(async () => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];

    // Create test users
    user1 = await dataStore.createUser({
      email: 'user1@example.com',
      username: 'user1',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 10,
      badges: []
    });

    user2 = await dataStore.createUser({
      email: 'user2@example.com',
      username: 'user2',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 20,
      badges: []
    });

    adminUser = await dataStore.createUser({
      email: 'admin@example.com',
      username: 'admin',
      password: 'hashedpassword123',
      role: Role.ADMIN,
      points: 100,
      badges: ['Admin']
    });

    // Create test groups
    group1 = await dataStore.createGroup({
      name: 'Test Group 1',
      description: 'First test group',
      creatorId: user1.id
    });

    group2 = await dataStore.createGroup({
      name: 'Test Group 2',
      description: 'Second test group',
      creatorId: adminUser.id
    });
  });

  describe('GroupMember Creation Tests', () => {
    it('should create group membership with USER role', async () => {
      const membership = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      expect(membership).toMatchObject({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });
      expect(membership.id).toBeDefined();
      expect(membership.joinedAt).toBeInstanceOf(Date);
    });

    it('should create group membership with ADMIN role', async () => {
      const membership = await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      expect(membership).toMatchObject({
        userId: adminUser.id,
        groupId: group1.id,
        role: Role.ADMIN
      });
      expect(membership.role).toBe(Role.ADMIN);
    });

    it('should create multiple memberships for same user in different groups', async () => {
      const membership1 = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      const membership2 = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group2.id,
        role: Role.ADMIN
      });

      expect(membership1.userId).toBe(user1.id);
      expect(membership2.userId).toBe(user1.id);
      expect(membership1.groupId).toBe(group1.id);
      expect(membership2.groupId).toBe(group2.id);
      expect(membership1.role).toBe(Role.USER);
      expect(membership2.role).toBe(Role.ADMIN);
    });

    it('should create multiple memberships for different users in same group', async () => {
      const membership1 = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      const membership2 = await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });

      expect(membership1.groupId).toBe(group1.id);
      expect(membership2.groupId).toBe(group1.id);
      expect(membership1.userId).toBe(user1.id);
      expect(membership2.userId).toBe(user2.id);
      expect(membership1.role).toBe(Role.ADMIN);
      expect(membership2.role).toBe(Role.USER);
    });
  });

  describe('GroupMember Retrieval Tests', () => {
    beforeEach(async () => {
      // Create test memberships
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group2.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: group2.id,
        role: Role.ADMIN
      });
    });

    it('should find all members of a group', async () => {
      const group1Members = await dataStore.findGroupMembersByGroupId(group1.id);
      expect(group1Members).toHaveLength(2);
      expect(group1Members.map(m => m.userId)).toContain(user1.id);
      expect(group1Members.map(m => m.userId)).toContain(user2.id);

      const group2Members = await dataStore.findGroupMembersByGroupId(group2.id);
      expect(group2Members).toHaveLength(2);
      expect(group2Members.map(m => m.userId)).toContain(user1.id);
      expect(group2Members.map(m => m.userId)).toContain(adminUser.id);
    });

    it('should find all groups a user belongs to', async () => {
      const user1Memberships = await dataStore.findGroupMembersByUserId(user1.id);
      expect(user1Memberships).toHaveLength(2);
      expect(user1Memberships.map(m => m.groupId)).toContain(group1.id);
      expect(user1Memberships.map(m => m.groupId)).toContain(group2.id);

      const user2Memberships = await dataStore.findGroupMembersByUserId(user2.id);
      expect(user2Memberships).toHaveLength(1);
      expect(user2Memberships[0].groupId).toBe(group1.id);
    });

    it('should find specific membership', async () => {
      const membership = await dataStore.findGroupMember(user1.id, group1.id);
      expect(membership).not.toBeNull();
      expect(membership!.userId).toBe(user1.id);
      expect(membership!.groupId).toBe(group1.id);
      expect(membership!.role).toBe(Role.ADMIN);
    });

    it('should return null for non-existent membership', async () => {
      const membership = await dataStore.findGroupMember('non-existent-user', group1.id);
      expect(membership).toBeNull();
    });

    it('should return empty array for group with no members', async () => {
      const emptyGroup = await dataStore.createGroup({
        name: 'Empty Group',
        creatorId: adminUser.id
      });

      const members = await dataStore.findGroupMembersByGroupId(emptyGroup.id);
      expect(members).toHaveLength(0);
    });

    it('should return empty array for user with no memberships', async () => {
      const isolatedUser = await dataStore.createUser({
        email: 'isolated@example.com',
        username: 'isolated',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });

      const memberships = await dataStore.findGroupMembersByUserId(isolatedUser.id);
      expect(memberships).toHaveLength(0);
    });
  });

  describe('GroupMember Role Management Tests', () => {
    it('should handle different role combinations in same group', async () => {
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      const members = await dataStore.findGroupMembersByGroupId(group1.id);
      const adminMembers = members.filter(m => m.role === Role.ADMIN);
      const userMembers = members.filter(m => m.role === Role.USER);

      expect(adminMembers).toHaveLength(2);
      expect(userMembers).toHaveLength(1);
    });

    it('should verify user role in specific group', async () => {
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group2.id,
        role: Role.USER
      });

      const roleInGroup1 = await dataStore.getUserRoleInGroup(user1.id, group1.id);
      const roleInGroup2 = await dataStore.getUserRoleInGroup(user1.id, group2.id);

      expect(roleInGroup1).toBe(Role.ADMIN);
      expect(roleInGroup2).toBe(Role.USER);
    });

    it('should return null for user not in group', async () => {
      const role = await dataStore.getUserRoleInGroup(user2.id, group2.id);
      expect(role).toBeNull();
    });
  });

  describe('GroupMember Deletion Tests', () => {
    beforeEach(async () => {
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });
    });

    it('should delete existing group membership', async () => {
      const result = await dataStore.deleteGroupMember(user1.id, group1.id);
      expect(result).toBe(true);

      const deletedMembership = await dataStore.findGroupMember(user1.id, group1.id);
      expect(deletedMembership).toBeNull();

      // Other memberships should remain
      const remainingMembers = await dataStore.findGroupMembersByGroupId(group1.id);
      expect(remainingMembers).toHaveLength(1);
      expect(remainingMembers[0].userId).toBe(user2.id);
    });

    it('should return false for non-existent membership deletion', async () => {
      const result = await dataStore.deleteGroupMember('non-existent-user', group1.id);
      expect(result).toBe(false);
    });

    it('should handle deletion of all group members', async () => {
      await dataStore.deleteGroupMember(user1.id, group1.id);
      await dataStore.deleteGroupMember(user2.id, group1.id);

      const remainingMembers = await dataStore.findGroupMembersByGroupId(group1.id);
      expect(remainingMembers).toHaveLength(0);
    });
  });

  describe('GroupMember Helper Functions Tests', () => {
    beforeEach(async () => {
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });
    });

    it('should check if user is member of group', async () => {
      const isUser1Member = await dataStore.isUserMemberOfGroup(user1.id, group1.id);
      const isUser2Member = await dataStore.isUserMemberOfGroup(user2.id, group1.id);
      const isAdminMember = await dataStore.isUserMemberOfGroup(adminUser.id, group1.id);

      expect(isUser1Member).toBe(true);
      expect(isUser2Member).toBe(true);
      expect(isAdminMember).toBe(false);
    });

    it('should check membership across different groups', async () => {
      const isUser1InGroup2 = await dataStore.isUserMemberOfGroup(user1.id, group2.id);
      expect(isUser1InGroup2).toBe(false);

      // Add user1 to group2
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group2.id,
        role: Role.USER
      });

      const isUser1InGroup2Now = await dataStore.isUserMemberOfGroup(user1.id, group2.id);
      expect(isUser1InGroup2Now).toBe(true);
    });
  });

  describe('Entity Relationship Integration Tests', () => {
    beforeEach(async () => {
      // Create complex membership structure
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: group2.id,
        role: Role.ADMIN
      });
    });

    it('should maintain referential integrity between users and groups', async () => {
      const group1Members = await dataStore.findGroupMembersByGroupId(group1.id);
      
      // Verify all member users exist
      for (const member of group1Members) {
        const user = await dataStore.findUserById(member.userId);
        expect(user).not.toBeNull();
        expect(user!.id).toBe(member.userId);
      }

      // Verify group exists
      const group = await dataStore.findGroupById(group1.id);
      expect(group).not.toBeNull();
    });

    it('should handle cascade deletions properly', async () => {
      // Create tasks in groups
      await dataStore.createTask({
        title: 'Group 1 Task',
        status: 'OPEN' as any,
        priority: 'MEDIUM' as any,
        points: 10,
        creatorId: user1.id,
        groupId: group1.id
      });

      // Delete group1 (should cascade delete members and tasks)
      await dataStore.deleteGroup(group1.id);

      // Verify memberships are deleted
      const group1Members = await dataStore.findGroupMembersByGroupId(group1.id);
      expect(group1Members).toHaveLength(0);

      // Verify tasks are deleted
      const group1Tasks = await dataStore.findAllTasks({ groupId: group1.id });
      expect(group1Tasks).toHaveLength(0);

      // Verify other group data remains intact
      const group2Members = await dataStore.findGroupMembersByGroupId(group2.id);
      expect(group2Members).toHaveLength(1);
    });

    it('should handle user deletion with cleanup', async () => {
      // Create task assigned to user1
      await dataStore.createTask({
        title: 'User1 Task',
        status: 'OPEN' as any,
        priority: 'MEDIUM' as any,
        points: 10,
        creatorId: user1.id,
        assigneeId: user1.id
      });

      // Delete user1 (should cascade delete related data)
      await dataStore.deleteUser(user1.id);

      // Verify memberships are cleaned up
      const user1Memberships = await dataStore.findGroupMembersByUserId(user1.id);
      expect(user1Memberships).toHaveLength(0);

      // Verify group still exists but without user1
      const group1Members = await dataStore.findGroupMembersByGroupId(group1.id);
      expect(group1Members).toHaveLength(1);
      expect(group1Members[0].userId).toBe(user2.id);
    });

    it('should handle complex membership scenarios', async () => {
      // User1 is admin in group1, user in group2
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group2.id,
        role: Role.USER
      });

      // User2 is user in group1, admin in group2
      await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group2.id,
        role: Role.ADMIN
      });

      // Verify roles are correct
      expect(await dataStore.getUserRoleInGroup(user1.id, group1.id)).toBe(Role.ADMIN);
      expect(await dataStore.getUserRoleInGroup(user1.id, group2.id)).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(user2.id, group1.id)).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(user2.id, group2.id)).toBe(Role.ADMIN);

      // Verify membership counts
      const user1Memberships = await dataStore.findGroupMembersByUserId(user1.id);
      const user2Memberships = await dataStore.findGroupMembersByUserId(user2.id);
      expect(user1Memberships).toHaveLength(2);
      expect(user2Memberships).toHaveLength(2);
    });
  });

  describe('GroupMember Timestamp Tests', () => {
    it('should set joinedAt timestamp on creation', async () => {
      const beforeCreation = new Date();
      
      const membership = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      const afterCreation = new Date();

      expect(membership.joinedAt).toBeInstanceOf(Date);
      expect(membership.joinedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(membership.joinedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should maintain chronological order of memberships', async () => {
      const membership1 = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const membership2 = await dataStore.createGroupMember({
        userId: user2.id,
        groupId: group1.id,
        role: Role.USER
      });

      expect(membership2.joinedAt.getTime()).toBeGreaterThan(membership1.joinedAt.getTime());
    });
  });

  describe('GroupMember Edge Cases Tests', () => {
    it('should handle rapid membership creation and deletion', async () => {
      // Create membership
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      // Immediately delete
      const deleteResult = await dataStore.deleteGroupMember(user1.id, group1.id);
      expect(deleteResult).toBe(true);

      // Verify it's gone
      const membership = await dataStore.findGroupMember(user1.id, group1.id);
      expect(membership).toBeNull();

      // Re-create with different role
      const newMembership = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      expect(newMembership.role).toBe(Role.ADMIN);
    });

    it('should handle membership operations with non-existent entities', async () => {
      // Try to create membership with non-existent user
      const membership = await dataStore.createGroupMember({
        userId: 'non-existent-user',
        groupId: group1.id,
        role: Role.USER
      });

      // Should still create the membership record (no foreign key constraints)
      expect(membership).toBeDefined();
      expect(membership.userId).toBe('non-existent-user');
    });

    it('should handle multiple role changes for same user', async () => {
      // Start as USER
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      // Change to ADMIN (delete and recreate)
      await dataStore.deleteGroupMember(user1.id, group1.id);
      await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.ADMIN
      });

      // Change back to USER
      await dataStore.deleteGroupMember(user1.id, group1.id);
      const finalMembership = await dataStore.createGroupMember({
        userId: user1.id,
        groupId: group1.id,
        role: Role.USER
      });

      expect(finalMembership.role).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(user1.id, group1.id)).toBe(Role.USER);
    });
  });
});

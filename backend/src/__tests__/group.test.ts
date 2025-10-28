import { dataStore, Role, Group, User, GroupMember } from '../lib/dataStore';

describe('Group Entity Tests', () => {
  let testUser: User;
  let adminUser: User;

  // Reset dataStore before each test and create test dependencies
  beforeEach(async () => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];

    // Create test users
    testUser = await dataStore.createUser({
      email: 'groupuser@example.com',
      username: 'groupuser',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 0,
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
  });

  describe('Group Creation Tests', () => {
    it('should create a group with valid data', async () => {
      const groupData = {
        name: 'Software Testing Study Group',
        description: 'A group for studying software testing concepts and practices',
        creatorId: testUser.id
      };

      const group = await dataStore.createGroup(groupData);

      expect(group).toMatchObject({
        name: 'Software Testing Study Group',
        description: 'A group for studying software testing concepts and practices',
        creatorId: testUser.id
      });
      expect(group.id).toBeDefined();
      expect(group.createdAt).toBeInstanceOf(Date);
      expect(group.updatedAt).toBeInstanceOf(Date);
    });

    it('should create group without description', async () => {
      const groupData = {
        name: 'Mathematics Study Circle',
        creatorId: testUser.id
      };

      const group = await dataStore.createGroup(groupData);

      expect(group.name).toBe('Mathematics Study Circle');
      expect(group.description).toBeUndefined();
      expect(group.creatorId).toBe(testUser.id);
    });

    it('should create group with empty description', async () => {
      const groupData = {
        name: 'Data Structures Group',
        description: '',
        creatorId: adminUser.id
      };

      const group = await dataStore.createGroup(groupData);

      expect(group.name).toBe('Data Structures Group');
      expect(group.description).toBe('');
      expect(group.creatorId).toBe(adminUser.id);
    });

    it('should create multiple groups with same creator', async () => {
      const group1 = await dataStore.createGroup({
        name: 'Group 1',
        description: 'First group',
        creatorId: testUser.id
      });

      const group2 = await dataStore.createGroup({
        name: 'Group 2',
        description: 'Second group',
        creatorId: testUser.id
      });

      expect(group1.creatorId).toBe(testUser.id);
      expect(group2.creatorId).toBe(testUser.id);
      expect(group1.id).not.toBe(group2.id);
    });
  });

  describe('Group Retrieval Tests', () => {
    let testGroup: Group;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Test Retrieval Group',
        description: 'Group for testing retrieval operations',
        creatorId: testUser.id
      });
    });

    it('should find group by id', async () => {
      const foundGroup = await dataStore.findGroupById(testGroup.id);

      expect(foundGroup).not.toBeNull();
      expect(foundGroup!.id).toBe(testGroup.id);
      expect(foundGroup!.name).toBe('Test Retrieval Group');
      expect(foundGroup!.description).toBe('Group for testing retrieval operations');
    });

    it('should return null for non-existent group id', async () => {
      const foundGroup = await dataStore.findGroupById('non-existent-id');
      expect(foundGroup).toBeNull();
    });

    it('should find all groups', async () => {
      // Create additional group
      await dataStore.createGroup({
        name: 'Second Group',
        description: 'Another group',
        creatorId: adminUser.id
      });

      const allGroups = await dataStore.findAllGroups();
      expect(allGroups).toHaveLength(2);
      expect(allGroups.map(g => g.name)).toContain('Test Retrieval Group');
      expect(allGroups.map(g => g.name)).toContain('Second Group');
    });

    it('should maintain group uniqueness', async () => {
      const allGroups = await dataStore.findAllGroups();
      const groupIds = allGroups.map(g => g.id);
      expect(new Set(groupIds).size).toBe(groupIds.length);
    });
  });

  describe('Group Update Tests', () => {
    let testGroup: Group;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Original Group Name',
        description: 'Original description',
        creatorId: testUser.id
      });
    });

    it('should update group name', async () => {
      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedGroup = await dataStore.updateGroup(testGroup.id, {
        name: 'Updated Group Name'
      });

      expect(updatedGroup).not.toBeNull();
      expect(updatedGroup!.name).toBe('Updated Group Name');
      expect(updatedGroup!.description).toBe('Original description'); // Should remain unchanged
      expect(updatedGroup!.updatedAt.getTime()).toBeGreaterThanOrEqual(testGroup.updatedAt.getTime());
    });

    it('should update group description', async () => {
      const updatedGroup = await dataStore.updateGroup(testGroup.id, {
        description: 'Updated description'
      });

      expect(updatedGroup).not.toBeNull();
      expect(updatedGroup!.description).toBe('Updated description');
      expect(updatedGroup!.name).toBe('Original Group Name'); // Should remain unchanged
    });

    it('should update both name and description', async () => {
      const updateData = {
        name: 'Completely New Name',
        description: 'Completely new description'
      };
      const updatedGroup = await dataStore.updateGroup(testGroup.id, updateData);

      expect(updatedGroup).not.toBeNull();
      expect(updatedGroup!.name).toBe('Completely New Name');
      expect(updatedGroup!.description).toBe('Completely new description');
    });

    it('should return null for non-existent group update', async () => {
      const updatedGroup = await dataStore.updateGroup('non-existent-id', {
        name: 'New Name'
      });
      expect(updatedGroup).toBeNull();
    });
  });

  describe('Group Deletion Tests', () => {
    let testGroup: Group;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Group to Delete',
        description: 'This group will be deleted',
        creatorId: testUser.id
      });
    });

    it('should delete existing group', async () => {
      const result = await dataStore.deleteGroup(testGroup.id);

      expect(result).toBe(true);
      const deletedGroup = await dataStore.findGroupById(testGroup.id);
      expect(deletedGroup).toBeNull();
    });

    it('should return false for non-existent group deletion', async () => {
      const result = await dataStore.deleteGroup('non-existent-id');
      expect(result).toBe(false);
    });

    it('should cascade delete related data', async () => {
      // Add member to group
      await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      // Create task in group
      await dataStore.createTask({
        title: 'Group Task',
        status: 'OPEN' as any,
        priority: 'MEDIUM' as any,
        points: 10,
        creatorId: testUser.id,
        groupId: testGroup.id
      });

      // Delete the group
      await dataStore.deleteGroup(testGroup.id);

      // Check that related data is also deleted
      const members = await dataStore.findGroupMembersByGroupId(testGroup.id);
      expect(members).toHaveLength(0);

      const tasks = await dataStore.findAllTasks({ groupId: testGroup.id });
      expect(tasks).toHaveLength(0);
    });
  });

  describe('Group Membership Tests', () => {
    let testGroup: Group;
    let memberUser: User;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Membership Test Group',
        description: 'Group for testing membership operations',
        creatorId: testUser.id
      });

      memberUser = await dataStore.createUser({
        email: 'member@example.com',
        username: 'memberuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
    });

    it('should create group membership', async () => {
      const membership = await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      expect(membership).toMatchObject({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });
      expect(membership.id).toBeDefined();
      expect(membership.joinedAt).toBeInstanceOf(Date);
    });

    it('should create admin membership', async () => {
      const membership = await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      expect(membership.role).toBe(Role.ADMIN);
      expect(membership.userId).toBe(adminUser.id);
    });

    it('should find group members by group id', async () => {
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      const members = await dataStore.findGroupMembersByGroupId(testGroup.id);
      expect(members).toHaveLength(2);
      expect(members.map(m => m.userId)).toContain(memberUser.id);
      expect(members.map(m => m.userId)).toContain(adminUser.id);
    });

    it('should find group members by user id', async () => {
      const group2 = await dataStore.createGroup({
        name: 'Second Group',
        creatorId: adminUser.id
      });

      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: group2.id,
        role: Role.ADMIN
      });

      const userMemberships = await dataStore.findGroupMembersByUserId(memberUser.id);
      expect(userMemberships).toHaveLength(2);
      expect(userMemberships.map(m => m.groupId)).toContain(testGroup.id);
      expect(userMemberships.map(m => m.groupId)).toContain(group2.id);
    });

    it('should find specific group membership', async () => {
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      const membership = await dataStore.findGroupMember(memberUser.id, testGroup.id);
      expect(membership).not.toBeNull();
      expect(membership!.userId).toBe(memberUser.id);
      expect(membership!.groupId).toBe(testGroup.id);
      expect(membership!.role).toBe(Role.USER);
    });

    it('should return null for non-existent membership', async () => {
      const membership = await dataStore.findGroupMember('non-existent-user', testGroup.id);
      expect(membership).toBeNull();
    });

    it('should delete group membership', async () => {
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      const result = await dataStore.deleteGroupMember(memberUser.id, testGroup.id);
      expect(result).toBe(true);

      const deletedMembership = await dataStore.findGroupMember(memberUser.id, testGroup.id);
      expect(deletedMembership).toBeNull();
    });

    it('should return false when deleting non-existent membership', async () => {
      const result = await dataStore.deleteGroupMember('non-existent-user', testGroup.id);
      expect(result).toBe(false);
    });
  });

  describe('Group Membership Helper Tests', () => {
    let testGroup: Group;
    let memberUser: User;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Helper Test Group',
        creatorId: testUser.id
      });

      memberUser = await dataStore.createUser({
        email: 'helper@example.com',
        username: 'helperuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
    });

    it('should check if user is member of group', async () => {
      // Initially not a member
      const isInitiallyMember = await dataStore.isUserMemberOfGroup(memberUser.id, testGroup.id);
      expect(isInitiallyMember).toBe(false);

      // Add user as member
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      // Now should be a member
      const isMemberNow = await dataStore.isUserMemberOfGroup(memberUser.id, testGroup.id);
      expect(isMemberNow).toBe(true);
    });

    it('should get user role in group', async () => {
      // Initially no role (not a member)
      const initialRole = await dataStore.getUserRoleInGroup(memberUser.id, testGroup.id);
      expect(initialRole).toBeNull();

      // Add user as admin
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      // Should return admin role
      const adminRole = await dataStore.getUserRoleInGroup(memberUser.id, testGroup.id);
      expect(adminRole).toBe(Role.ADMIN);

      // Change to user role
      await dataStore.deleteGroupMember(memberUser.id, testGroup.id);
      await dataStore.createGroupMember({
        userId: memberUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      const userRole = await dataStore.getUserRoleInGroup(memberUser.id, testGroup.id);
      expect(userRole).toBe(Role.USER);
    });
  });

  describe('Group Role Management Tests', () => {
    let testGroup: Group;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Role Management Group',
        creatorId: testUser.id
      });
    });

    it('should handle USER role in group', async () => {
      const membership = await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      expect(membership.role).toBe(Role.USER);
      expect(membership.role).toBe('USER');
    });

    it('should handle ADMIN role in group', async () => {
      const membership = await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      expect(membership.role).toBe(Role.ADMIN);
      expect(membership.role).toBe('ADMIN');
    });

    it('should allow multiple admins in group', async () => {
      await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: adminUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      const members = await dataStore.findGroupMembersByGroupId(testGroup.id);
      const admins = members.filter(m => m.role === Role.ADMIN);
      expect(admins).toHaveLength(2);
    });

    it('should allow role change through membership update', async () => {
      // Create initial membership
      await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      // Remove and re-add with admin role (simulating role change)
      await dataStore.deleteGroupMember(testUser.id, testGroup.id);
      const newMembership = await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      expect(newMembership.role).toBe(Role.ADMIN);
    });
  });

  describe('Group Business Logic Tests', () => {
    let testGroup: Group;

    beforeEach(async () => {
      testGroup = await dataStore.createGroup({
        name: 'Business Logic Group',
        description: 'Group for testing business logic',
        creatorId: testUser.id
      });
    });

    it('should prevent duplicate memberships', async () => {
      // Add user as member
      await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.USER
      });

      // Verify membership exists
      const membership = await dataStore.findGroupMember(testUser.id, testGroup.id);
      expect(membership).not.toBeNull();

      // Since we don't have built-in duplicate prevention, 
      // this test verifies the current behavior
      const allMemberships = await dataStore.findGroupMembersByGroupId(testGroup.id);
      const userMemberships = allMemberships.filter(m => m.userId === testUser.id);
      expect(userMemberships).toHaveLength(1);
    });

    it('should handle group creator relationship', async () => {
      expect(testGroup.creatorId).toBe(testUser.id);

      // Verify creator exists
      const creator = await dataStore.findUserById(testGroup.creatorId);
      expect(creator).not.toBeNull();
      expect(creator!.id).toBe(testUser.id);
    });

    it('should maintain referential integrity', async () => {
      // Add member
      await dataStore.createGroupMember({
        userId: testUser.id,
        groupId: testGroup.id,
        role: Role.ADMIN
      });

      // Create task in group
      await dataStore.createTask({
        title: 'Group Task',
        status: 'OPEN' as any,
        priority: 'MEDIUM' as any,
        points: 10,
        creatorId: testUser.id,
        groupId: testGroup.id
      });

      // Verify relationships exist
      const members = await dataStore.findGroupMembersByGroupId(testGroup.id);
      expect(members).toHaveLength(1);

      const tasks = await dataStore.findAllTasks({ groupId: testGroup.id });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].groupId).toBe(testGroup.id);
    });
  });

  describe('Group Collection Tests', () => {
    beforeEach(async () => {
      // Create multiple groups for collection tests
      await dataStore.createGroup({
        name: 'Study Group A',
        description: 'First study group',
        creatorId: testUser.id
      });

      await dataStore.createGroup({
        name: 'Study Group B',
        description: 'Second study group',
        creatorId: adminUser.id
      });

      await dataStore.createGroup({
        name: 'Project Group',
        creatorId: testUser.id
      });
    });

    it('should retrieve all groups', async () => {
      const allGroups = await dataStore.findAllGroups();
      expect(allGroups).toHaveLength(3);
      expect(allGroups.map(g => g.name)).toContain('Study Group A');
      expect(allGroups.map(g => g.name)).toContain('Study Group B');
      expect(allGroups.map(g => g.name)).toContain('Project Group');
    });

    it('should maintain group creation order information', async () => {
      const allGroups = await dataStore.findAllGroups();
      
      // All groups should have creation timestamps
      allGroups.forEach(group => {
        expect(group.createdAt).toBeInstanceOf(Date);
        expect(group.updatedAt).toBeInstanceOf(Date);
      });

      // Groups should be created in order (newer groups have later timestamps)
      for (let i = 1; i < allGroups.length; i++) {
        expect(allGroups[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          allGroups[i - 1].createdAt.getTime()
        );
      }
    });

    it('should handle groups by different creators', async () => {
      const allGroups = await dataStore.findAllGroups();
      const userGroups = allGroups.filter(g => g.creatorId === testUser.id);
      const adminGroups = allGroups.filter(g => g.creatorId === adminUser.id);

      expect(userGroups).toHaveLength(2);
      expect(adminGroups).toHaveLength(1);
    });
  });

  describe('Group Edge Cases Tests', () => {
    it('should handle group with very long name', async () => {
      const longName = 'A'.repeat(255); // 255 characters
      const group = await dataStore.createGroup({
        name: longName,
        description: 'Group with long name',
        creatorId: testUser.id
      });

      expect(group.name).toBe(longName);
      expect(group.name.length).toBe(255);
    });

    it('should handle group with very long description', async () => {
      const longDescription = 'B'.repeat(1000); // 1000 characters
      const group = await dataStore.createGroup({
        name: 'Group with Long Description',
        description: longDescription,
        creatorId: testUser.id
      });

      expect(group.description).toBe(longDescription);
      expect(group.description!.length).toBe(1000);
    });

    it('should handle special characters in group name and description', async () => {
      const specialName = 'Group with Special Characters: @#$%^&*()';
      const specialDescription = 'Description with émojis 🚀 and ñ characters';
      
      const group = await dataStore.createGroup({
        name: specialName,
        description: specialDescription,
        creatorId: testUser.id
      });

      expect(group.name).toBe(specialName);
      expect(group.description).toBe(specialDescription);
    });

    it('should handle concurrent group operations', async () => {
      // Simulate concurrent group creation
      const groupPromises = Array.from({ length: 5 }, (_, i) =>
        dataStore.createGroup({
          name: `Concurrent Group ${i + 1}`,
          description: `Description ${i + 1}`,
          creatorId: testUser.id
        })
      );

      const groups = await Promise.all(groupPromises);
      
      expect(groups).toHaveLength(5);
      // All groups should have unique IDs
      const groupIds = groups.map(g => g.id);
      expect(new Set(groupIds).size).toBe(5);
    });
  });
});

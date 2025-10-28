import { dataStore, Role, TaskStatus, TaskPriority, User, Group, Task, GroupMember } from '../lib/dataStore';

describe('Integration Tests - All Entities Working Together', () => {
  let alice: User, bob: User, admin: User;
  let studyGroup: Group, projectGroup: Group;

  beforeEach(async () => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];
    (dataStore as any).taskComments = [];
    (dataStore as any).auditLogs = [];
    (dataStore as any).notifications = [];

    // Create test users
    alice = await dataStore.createUser({
      email: 'alice@studyconnect.com',
      username: 'alice',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 50,
      badges: ['Early Bird']
    });

    bob = await dataStore.createUser({
      email: 'bob@studyconnect.com',
      username: 'bob',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 30,
      badges: []
    });

    admin = await dataStore.createUser({
      email: 'admin@studyconnect.com',
      username: 'admin',
      password: 'hashedpassword123',
      role: Role.ADMIN,
      points: 100,
      badges: ['Admin', 'Founder']
    });

    // Create test groups
    studyGroup = await dataStore.createGroup({
      name: 'Software Testing Study Group',
      description: 'A group for studying software testing concepts and practices',
      creatorId: alice.id
    });

    projectGroup = await dataStore.createGroup({
      name: 'Final Project Team',
      description: 'Team working on the final semester project',
      creatorId: admin.id
    });
  });

  describe('Complete Workflow Integration Tests', () => {
    it('should handle complete StudyConnect workflow', async () => {
      // 1. Set up group memberships
      const aliceAdminMembership = await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      const bobUserMembership = await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      const adminProjectMembership = await dataStore.createGroupMember({
        userId: admin.id,
        groupId: projectGroup.id,
        role: Role.ADMIN
      });

      const aliceProjectMembership = await dataStore.createGroupMember({
        userId: alice.id,
        groupId: projectGroup.id,
        role: Role.USER
      });

      // 2. Create various tasks
      const unitTestingTask = await dataStore.createTask({
        title: 'Complete Unit Testing Exercise',
        description: 'Write comprehensive unit tests for the User, Task, and Group entities',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        points: 25,
        creatorId: alice.id,
        assigneeId: bob.id,
        groupId: studyGroup.id,
        category: 'Testing'
      });

      const integrationTask = await dataStore.createTask({
        title: 'Implement Integration Tests',
        description: 'Create integration tests for API endpoints',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        points: 30,
        creatorId: admin.id,
        assigneeId: alice.id,
        groupId: projectGroup.id,
        category: 'Development'
      });

      const researchTask = await dataStore.createTask({
        title: 'Research Testing Frameworks',
        description: 'Research and compare different testing frameworks',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        points: 15,
        creatorId: alice.id,
        assigneeId: alice.id,
        groupId: studyGroup.id,
        category: 'Research'
      });

      // 3. Verify task assignments and relationships
      const bobTasks = await dataStore.findAllTasks({ assigneeId: bob.id });
      expect(bobTasks).toHaveLength(1);
      expect(bobTasks[0].id).toBe(unitTestingTask.id);

      const aliceTasks = await dataStore.findAllTasks({ assigneeId: alice.id });
      expect(aliceTasks).toHaveLength(2);

      const studyGroupTasks = await dataStore.findAllTasks({ groupId: studyGroup.id });
      expect(studyGroupTasks).toHaveLength(2);

      // 4. Test task completion workflow
      const completedTask = await dataStore.updateTask(unitTestingTask.id, {
        status: TaskStatus.DONE
      });
      expect(completedTask!.status).toBe(TaskStatus.DONE);

      // 5. Award points and badges
      await dataStore.updateUser(bob.id, { points: bob.points + unitTestingTask.points });
      const newBadges = await dataStore.checkAndAwardBadges(bob.id);
      
      const updatedBob = await dataStore.findUserById(bob.id);
      expect(updatedBob!.points).toBe(55); // 30 + 25

      // 6. Verify group membership status
      expect(await dataStore.isUserMemberOfGroup(alice.id, studyGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(bob.id, studyGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(alice.id, projectGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(bob.id, projectGroup.id)).toBe(false);

      // 7. Test role verification
      expect(await dataStore.getUserRoleInGroup(alice.id, studyGroup.id)).toBe(Role.ADMIN);
      expect(await dataStore.getUserRoleInGroup(bob.id, studyGroup.id)).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(alice.id, projectGroup.id)).toBe(Role.USER);
    });

    it('should handle task lifecycle with group context', async () => {
      // Set up group membership
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      // Create task in group context
      const groupTask = await dataStore.createTask({
        title: 'Group Project Planning',
        description: 'Plan the structure and timeline for the group project',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        points: 20,
        creatorId: alice.id,
        groupId: studyGroup.id
      });

      // Assign task to group member
      const assignedTask = await dataStore.updateTask(groupTask.id, {
        assigneeId: bob.id,
        status: TaskStatus.IN_PROGRESS
      });

      // Verify task relationships
      const taskWithRelations = await dataStore.getTaskWithRelations(groupTask.id);
      expect(taskWithRelations!.creator!.id).toBe(alice.id);
      expect(taskWithRelations!.assignee!.id).toBe(bob.id);
      expect(taskWithRelations!.group!.id).toBe(studyGroup.id);

      // Complete task and update user
      await dataStore.updateTask(groupTask.id, { status: TaskStatus.DONE });
      await dataStore.updateUser(bob.id, { 
        points: bob.points + groupTask.points 
      });

      // Verify final state
      const completedTask = await dataStore.findTaskById(groupTask.id);
      const updatedBob = await dataStore.findUserById(bob.id);
      
      expect(completedTask!.status).toBe(TaskStatus.DONE);
      expect(updatedBob!.points).toBe(50); // 30 + 20
    });

    it('should handle complex filtering and queries', async () => {
      // Set up complex data structure
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: admin.id,
        groupId: projectGroup.id,
        role: Role.ADMIN
      });

      // Create various tasks with different properties
      const tasks = [
        await dataStore.createTask({
          title: 'High Priority Open Task',
          status: TaskStatus.OPEN,
          priority: TaskPriority.HIGH,
          points: 30,
          creatorId: alice.id,
          assigneeId: bob.id,
          groupId: studyGroup.id,
          category: 'Testing'
        }),
        await dataStore.createTask({
          title: 'Medium Priority In Progress Task',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          points: 20,
          creatorId: alice.id,
          assigneeId: alice.id,
          groupId: studyGroup.id,
          category: 'Development'
        }),
        await dataStore.createTask({
          title: 'Low Priority Done Task',
          status: TaskStatus.DONE,
          priority: TaskPriority.LOW,
          points: 10,
          creatorId: admin.id,
          assigneeId: admin.id,
          groupId: projectGroup.id,
          category: 'Documentation'
        }),
        await dataStore.createTask({
          title: 'Urgent Individual Task',
          status: TaskStatus.OPEN,
          priority: TaskPriority.URGENT,
          points: 40,
          creatorId: admin.id,
          assigneeId: alice.id,
          category: 'Research'
        })
      ];

      // Test various filters
      const highPriorityTasks = await dataStore.findAllTasks({ priority: TaskPriority.HIGH });
      expect(highPriorityTasks).toHaveLength(1);

      const aliceAssignedTasks = await dataStore.findAllTasks({ assigneeId: alice.id });
      expect(aliceAssignedTasks).toHaveLength(2);

      const studyGroupTasks = await dataStore.findAllTasks({ groupId: studyGroup.id });
      expect(studyGroupTasks).toHaveLength(2);

      const openTasks = await dataStore.findAllTasks({ status: TaskStatus.OPEN });
      expect(openTasks).toHaveLength(2);

      const testingTasks = await dataStore.findAllTasks({ category: 'Testing' });
      expect(testingTasks).toHaveLength(1);

      // Test combined filters
      const aliceStudyGroupTasks = await dataStore.findAllTasks({
        assigneeId: alice.id,
        groupId: studyGroup.id
      });
      expect(aliceStudyGroupTasks).toHaveLength(1);

      const openHighPriorityTasks = await dataStore.findAllTasks({
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH
      });
      expect(openHighPriorityTasks).toHaveLength(1);
    });

    it('should handle data consistency during cascading operations', async () => {
      // Set up initial data
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      const groupTask = await dataStore.createTask({
        title: 'Task to be affected by cascading',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 15,
        creatorId: alice.id,
        assigneeId: bob.id,
        groupId: studyGroup.id
      });

      // Verify initial state
      expect(await dataStore.findGroupMembersByGroupId(studyGroup.id)).toHaveLength(2);
      expect(await dataStore.findAllTasks({ groupId: studyGroup.id })).toHaveLength(1);

      // Delete group (should cascade)
      const deleteResult = await dataStore.deleteGroup(studyGroup.id);
      expect(deleteResult).toBe(true);

      // Verify cascading deletions
      expect(await dataStore.findGroupById(studyGroup.id)).toBeNull();
      expect(await dataStore.findGroupMembersByGroupId(studyGroup.id)).toHaveLength(0);
      expect(await dataStore.findAllTasks({ groupId: studyGroup.id })).toHaveLength(0);

      // Verify users still exist
      expect(await dataStore.findUserById(alice.id)).not.toBeNull();
      expect(await dataStore.findUserById(bob.id)).not.toBeNull();
    });

    it('should handle user deletion with proper cleanup', async () => {
      // Set up data with bob as creator and member
      await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      const bobCreatedTask = await dataStore.createTask({
        title: 'Task created by Bob',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 20,
        creatorId: bob.id,
        assigneeId: alice.id,
        groupId: studyGroup.id
      });

      const bobAssignedTask = await dataStore.createTask({
        title: 'Task assigned to Bob',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        points: 25,
        creatorId: alice.id,
        assigneeId: bob.id,
        groupId: studyGroup.id
      });

      // Verify initial state
      expect(await dataStore.findGroupMembersByUserId(bob.id)).toHaveLength(1);
      expect(await dataStore.findAllTasks({ creatorId: bob.id })).toHaveLength(1);
      expect(await dataStore.findAllTasks({ assigneeId: bob.id })).toHaveLength(1);

      // Delete bob
      const deleteResult = await dataStore.deleteUser(bob.id);
      expect(deleteResult).toBe(true);

      // Verify cleanup
      expect(await dataStore.findUserById(bob.id)).toBeNull();
      expect(await dataStore.findGroupMembersByUserId(bob.id)).toHaveLength(0);
      expect(await dataStore.findAllTasks({ creatorId: bob.id })).toHaveLength(0);
      expect(await dataStore.findAllTasks({ assigneeId: bob.id })).toHaveLength(0);

      // Verify other data remains
      expect(await dataStore.findGroupById(studyGroup.id)).not.toBeNull();
      expect(await dataStore.findGroupMembersByGroupId(studyGroup.id)).toHaveLength(1);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large numbers of entities efficiently', async () => {
      const startTime = Date.now();

      // Create multiple users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = await dataStore.createUser({
          email: `user${i}@test.com`,
          username: `user${i}`,
          password: 'hashedpassword123',
          role: Role.USER,
          points: i * 10,
          badges: []
        });
        users.push(user);
      }

      // Create multiple groups
      const groups = [];
      for (let i = 0; i < 5; i++) {
        const group = await dataStore.createGroup({
          name: `Test Group ${i}`,
          description: `Description for group ${i}`,
          creatorId: users[i % users.length].id
        });
        groups.push(group);
      }

      // Create memberships
      for (const user of users) {
        for (const group of groups.slice(0, 3)) { // Each user joins first 3 groups
          await dataStore.createGroupMember({
            userId: user.id,
            groupId: group.id,
            role: Math.random() > 0.5 ? Role.USER : Role.ADMIN
          });
        }
      }

      // Create many tasks
      for (let i = 0; i < 20; i++) {
        await dataStore.createTask({
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          status: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.DONE][i % 3],
          priority: [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT][i % 4],
          points: (i % 5 + 1) * 10,
          creatorId: users[i % users.length].id,
          assigneeId: users[(i + 1) % users.length].id,
          groupId: i < 15 ? groups[i % groups.length].id : undefined
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify data was created
      expect(await dataStore.findAllUsers()).toHaveLength(13); // 10 + alice, bob, admin
      expect(await dataStore.findAllGroups()).toHaveLength(7); // 5 + studyGroup, projectGroup
      expect(await dataStore.findAllTasks()).toHaveLength(20);

      // Should complete in reasonable time (less than 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle concurrent operations without data corruption', async () => {
      // Set up initial group
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      // Simulate concurrent task creation
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        dataStore.createTask({
          title: `Concurrent Task ${i}`,
          status: TaskStatus.OPEN,
          priority: TaskPriority.MEDIUM,
          points: 10,
          creatorId: alice.id,
          groupId: studyGroup.id
        })
      );

      const tasks = await Promise.all(taskPromises);

      // Verify all tasks were created successfully
      expect(tasks).toHaveLength(10);
      expect(new Set(tasks.map(t => t.id)).size).toBe(10); // All unique IDs

      // Verify tasks are in database
      const studyGroupTasks = await dataStore.findAllTasks({ groupId: studyGroup.id });
      expect(studyGroupTasks).toHaveLength(10);
    });
  });

  describe('Business Logic Integration Tests', () => {
    it('should handle badge awarding system correctly', async () => {
      // Create tasks and complete them to trigger badge awards
      const tasks = [];
      for (let i = 0; i < 12; i++) {
        const task = await dataStore.createTask({
          title: `Badge Task ${i}`,
          status: TaskStatus.DONE,
          priority: TaskPriority.MEDIUM,
          points: 10,
          creatorId: alice.id,
          assigneeId: bob.id
        });
        tasks.push(task);
      }

      // Update bob's points and check badges
      const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
      await dataStore.updateUser(bob.id, { 
        points: bob.points + totalPoints 
      });

      const newBadges = await dataStore.checkAndAwardBadges(bob.id);
      const updatedBob = await dataStore.findUserById(bob.id);

      expect(updatedBob!.points).toBe(30 + totalPoints); // Original 30 + 120
      expect(newBadges).toContain('century'); // Should get 100+ points badge
      expect(newBadges).toContain('task_master'); // Should get 10+ tasks badge
      expect(updatedBob!.badges).toContain('century');
      expect(updatedBob!.badges).toContain('task_master');
    });

    it('should handle task overdue logic', async () => {
      // Create tasks with past due dates
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const overdueTasks = [];
      for (let i = 0; i < 3; i++) {
        const task = await dataStore.createTask({
          title: `Overdue Task ${i}`,
          status: TaskStatus.OPEN,
          priority: TaskPriority.HIGH,
          dueDate: pastDate,
          points: 20,
          creatorId: alice.id,
          assigneeId: bob.id
        });
        overdueTasks.push(task);
      }

      // Update overdue tasks
      const updateCount = await dataStore.updateManyTasks(
        { status: TaskStatus.OPEN, dueDate: new Date() },
        { status: TaskStatus.OVERDUE }
      );

      expect(updateCount).toBe(3);

      // Verify tasks are now overdue
      const overdueTasksAfterUpdate = await dataStore.findAllTasks({ 
        status: TaskStatus.OVERDUE 
      });
      expect(overdueTasksAfterUpdate).toHaveLength(3);
    });

    it('should handle complex group permission scenarios', async () => {
      // Set up complex permission structure
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      await dataStore.createGroupMember({
        userId: bob.id,
        groupId: studyGroup.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: projectGroup.id,
        role: Role.USER
      });

      await dataStore.createGroupMember({
        userId: admin.id,
        groupId: projectGroup.id,
        role: Role.ADMIN
      });

      // Test permission checks
      expect(await dataStore.getUserRoleInGroup(alice.id, studyGroup.id)).toBe(Role.ADMIN);
      expect(await dataStore.getUserRoleInGroup(alice.id, projectGroup.id)).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(bob.id, studyGroup.id)).toBe(Role.USER);
      expect(await dataStore.getUserRoleInGroup(bob.id, projectGroup.id)).toBeNull();

      // Verify membership status
      expect(await dataStore.isUserMemberOfGroup(alice.id, studyGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(alice.id, projectGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(bob.id, studyGroup.id)).toBe(true);
      expect(await dataStore.isUserMemberOfGroup(bob.id, projectGroup.id)).toBe(false);
    });
  });

  describe('Data Validation and Integrity Tests', () => {
    it('should maintain data consistency across operations', async () => {
      // Create complex relationships
      await dataStore.createGroupMember({
        userId: alice.id,
        groupId: studyGroup.id,
        role: Role.ADMIN
      });

      const task = await dataStore.createTask({
        title: 'Consistency Test Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 15,
        creatorId: alice.id,
        assigneeId: bob.id,
        groupId: studyGroup.id
      });

      // Verify relationships
      const taskWithRelations = await dataStore.getTaskWithRelations(task.id);
      expect(taskWithRelations!.creator!.id).toBe(alice.id);
      expect(taskWithRelations!.assignee!.id).toBe(bob.id);
      expect(taskWithRelations!.group!.id).toBe(studyGroup.id);

      // Update relationships
      await dataStore.updateTask(task.id, { assigneeId: alice.id });
      
      const updatedTaskWithRelations = await dataStore.getTaskWithRelations(task.id);
      expect(updatedTaskWithRelations!.assignee!.id).toBe(alice.id);
      expect(updatedTaskWithRelations!.creator!.id).toBe(alice.id);
    });

    it('should handle edge cases in entity relationships', async () => {
      // Test task without assignee
      const unassignedTask = await dataStore.createTask({
        title: 'Unassigned Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: alice.id
      });

      const taskWithRelations = await dataStore.getTaskWithRelations(unassignedTask.id);
      expect(taskWithRelations!.creator).toBeDefined();
      expect(taskWithRelations!.assignee).toBeUndefined();
      expect(taskWithRelations!.group).toBeUndefined();

      // Test task without group
      const individualTask = await dataStore.createTask({
        title: 'Individual Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: bob.id,
        assigneeId: bob.id
      });

      const individualTaskWithRelations = await dataStore.getTaskWithRelations(individualTask.id);
      expect(individualTaskWithRelations!.creator!.id).toBe(bob.id);
      expect(individualTaskWithRelations!.assignee!.id).toBe(bob.id);
      expect(individualTaskWithRelations!.group).toBeUndefined();
    });
  });
});

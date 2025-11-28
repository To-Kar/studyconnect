import { dataStore, Role, TaskPriority, TaskStatus, User, Task } from '../lib/dataStore';

describe('DataStore Additional Model Tests', () => {
  let user: User;
  let task: Task;

  beforeEach(async () => {
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];
    (dataStore as any).taskComments = [];
    (dataStore as any).auditLogs = [];
    (dataStore as any).notifications = [];

    user = await dataStore.createUser({
      email: 'extras@example.com',
      username: 'extras',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 0,
      badges: []
    });

    task = await dataStore.createTask({
      title: 'Base Task',
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      points: 5,
      creatorId: user.id,
      assigneeId: user.id
    });
  });

  describe('Task Comment Tests', () => {
    it('should create and retrieve task comments per task', async () => {
      const commentOne = await dataStore.createTaskComment({
        taskId: task.id,
        userId: user.id,
        content: 'First comment'
      });

      await dataStore.createTaskComment({
        taskId: task.id,
        userId: user.id,
        content: 'Second comment'
      });

      // Comment for different task should be excluded
      const otherTask = await dataStore.createTask({
        title: 'Other Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 3,
        creatorId: user.id
      });
      await dataStore.createTaskComment({
        taskId: otherTask.id,
        userId: user.id,
        content: 'Other task comment'
      });

      const comments = await dataStore.findTaskCommentsByTaskId(task.id);
      expect(comments).toHaveLength(2);
      expect(comments.map(c => c.content)).toEqual(['First comment', 'Second comment']);
      expect(commentOne.id).toBeDefined();
      expect(commentOne.createdAt).toBeInstanceOf(Date);
      expect(commentOne.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete task comment and handle missing comment', async () => {
      const comment = await dataStore.createTaskComment({
        taskId: task.id,
        userId: user.id,
        content: 'Disposable comment'
      });

      const deletionResult = await dataStore.deleteTaskComment(comment.id);
      const missingDeletion = await dataStore.deleteTaskComment('missing-id');
      const comments = await dataStore.findTaskCommentsByTaskId(task.id);

      expect(deletionResult).toBe(true);
      expect(missingDeletion).toBe(false);
      expect(comments).toHaveLength(0);
    });
  });

  describe('Audit Log Tests', () => {
    it('should create audit logs and filter by entity', async () => {
      await dataStore.createAuditLog({
        entityType: 'task',
        entityId: task.id,
        action: 'created',
        changes: { title: 'Base Task' },
        userId: user.id
      });

      await dataStore.createAuditLog({
        entityType: 'user',
        entityId: user.id,
        action: 'role_change',
        changes: { role: Role.ADMIN },
        userId: user.id
      });

      const taskLogs = await dataStore.findAuditLogsByEntity('task', task.id);
      const userLogs = await dataStore.findAuditLogsByEntity('user', user.id);

      expect(taskLogs).toHaveLength(1);
      expect(taskLogs[0].action).toBe('created');
      expect(userLogs).toHaveLength(1);
      expect(userLogs[0].changes).toEqual({ role: Role.ADMIN });
    });
  });

  describe('Notification Tests', () => {
    it('should store, sort, filter, and mark notifications as read', async () => {
      const firstNotification = await dataStore.createNotification({
        userId: user.id,
        type: 'reminder',
        title: 'Due soon',
        message: 'Task is due soon',
        read: false,
        taskId: task.id
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const secondNotification = await dataStore.createNotification({
        userId: user.id,
        type: 'assignment',
        title: 'New assignment',
        message: 'You have been assigned a task',
        read: false
      });

      await dataStore.createNotification({
        userId: 'other-user',
        type: 'reminder',
        title: 'Ignore me',
        message: 'Different user',
        read: false
      });

      const unread = await dataStore.findNotificationsByUserId(user.id, true);
      expect(unread).toHaveLength(2);

      const ordered = await dataStore.findNotificationsByUserId(user.id);
      expect(ordered[0].id).toBe(secondNotification.id);
      expect(ordered[1].id).toBe(firstNotification.id);

      const markResult = await dataStore.markNotificationAsRead(firstNotification.id);
      const missingMark = await dataStore.markNotificationAsRead('missing-id');
      const unreadAfterMark = await dataStore.findNotificationsByUserId(user.id, true);

      expect(markResult).toBe(true);
      expect(missingMark).toBe(false);
      expect(unreadAfterMark).toHaveLength(1);
      expect(unreadAfterMark[0].id).toBe(secondNotification.id);
    });
  });

  describe('Badge Awarding Tests', () => {
    it('should return empty badge list for unknown user', async () => {
      const badges = await dataStore.checkAndAwardBadges('non-existent-user');
      expect(badges).toEqual([]);
    });

    it('should award first_task badge after first completed assignment', async () => {
      await dataStore.createTask({
        title: 'Completed Task',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: user.id,
        assigneeId: user.id
      });

      const badges = await dataStore.checkAndAwardBadges(user.id);
      const updatedUser = await dataStore.findUserById(user.id);

      expect(badges).toContain('first_task');
      expect(updatedUser!.badges).toContain('first_task');
    });

    it('should award task_master after ten completed tasks without duplicating badges', async () => {
      // First completion to get first_task
      await dataStore.createTask({
        title: 'Initial Done Task',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        points: 1,
        creatorId: user.id,
        assigneeId: user.id
      });
      await dataStore.checkAndAwardBadges(user.id);

      // Add nine more completed tasks to reach milestone
      for (let i = 0; i < 9; i++) {
        await dataStore.createTask({
          title: `Done Task ${i + 2}`,
          status: TaskStatus.DONE,
          priority: TaskPriority.MEDIUM,
          points: 2,
          creatorId: user.id,
          assigneeId: user.id
        });
      }

      const badges = await dataStore.checkAndAwardBadges(user.id);
      const updatedUser = await dataStore.findUserById(user.id);
      const secondPass = await dataStore.checkAndAwardBadges(user.id);

      expect(badges).toContain('task_master');
      expect(badges).not.toContain('first_task');
      expect(updatedUser!.badges).toEqual(expect.arrayContaining(['first_task', 'task_master']));
      expect(secondPass).not.toContain('task_master');
    });
  });

  describe('Task Bulk Update Filtering Tests', () => {
    it('should only update tasks that match due date and status filters', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const pastOpen = await dataStore.createTask({
        title: 'Past open',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        dueDate: pastDate,
        points: 5,
        creatorId: user.id
      });

      const futureOpen = await dataStore.createTask({
        title: 'Future open',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        dueDate: futureDate,
        points: 5,
        creatorId: user.id
      });

      const pastDone = await dataStore.createTask({
        title: 'Past done',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueDate: pastDate,
        points: 5,
        creatorId: user.id
      });

      const noDueOpen = await dataStore.createTask({
        title: 'No due date',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        points: 5,
        creatorId: user.id
      });

      const updateCount = await dataStore.updateManyTasks(
        { status: TaskStatus.OPEN, dueDate: new Date() },
        { status: TaskStatus.OVERDUE }
      );

      const refreshedPastOpen = await dataStore.findTaskById(pastOpen.id);
      const refreshedFutureOpen = await dataStore.findTaskById(futureOpen.id);
      const refreshedPastDone = await dataStore.findTaskById(pastDone.id);
      const refreshedNoDueOpen = await dataStore.findTaskById(noDueOpen.id);

      expect(updateCount).toBe(1);
      expect(refreshedPastOpen!.status).toBe(TaskStatus.OVERDUE);
      expect(refreshedFutureOpen!.status).toBe(TaskStatus.OPEN);
      expect(refreshedPastDone!.status).toBe(TaskStatus.DONE);
      expect(refreshedNoDueOpen!.status).toBe(TaskStatus.OPEN);
    });
  });
});

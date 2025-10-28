import { dataStore, Role, TaskStatus, TaskPriority, Task, User, Group } from '../lib/dataStore';

describe('Task Entity Tests', () => {
  let testUser: User;
  let testGroup: Group;

  // Reset dataStore before each test and create test dependencies
  beforeEach(async () => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];

    // Create test user
    testUser = await dataStore.createUser({
      email: 'taskuser@example.com',
      username: 'taskuser',
      password: 'hashedpassword123',
      role: Role.USER,
      points: 0,
      badges: []
    });

    // Create test group
    testGroup = await dataStore.createGroup({
      name: 'Test Group',
      description: 'Test group for tasks',
      creatorId: testUser.id
    });
  });

  describe('Task Creation Tests', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Complete Unit Tests',
        description: 'Write comprehensive unit tests for the application',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        points: 20,
        creatorId: testUser.id,
        assigneeId: testUser.id,
        groupId: testGroup.id
      };

      const task = await dataStore.createTask(taskData);

      expect(task).toMatchObject({
        title: 'Complete Unit Tests',
        description: 'Write comprehensive unit tests for the application',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        points: 20,
        creatorId: testUser.id,
        assigneeId: testUser.id,
        groupId: testGroup.id
      });
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should create task with due date', async () => {
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const taskData = {
        title: 'Task with Due Date',
        description: 'This task has a due date',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        dueDate: dueDate,
        points: 10,
        creatorId: testUser.id
      };

      const task = await dataStore.createTask(taskData);

      expect(task.dueDate).toEqual(dueDate);
    });

    it('should create task without optional fields', async () => {
      const taskData = {
        title: 'Minimal Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: testUser.id
      };

      const task = await dataStore.createTask(taskData);

      expect(task.title).toBe('Minimal Task');
      expect(task.description).toBeUndefined();
      expect(task.assigneeId).toBeUndefined();
      expect(task.groupId).toBeUndefined();
      expect(task.dueDate).toBeUndefined();
    });

    it('should create task with category and notes', async () => {
      const taskData = {
        title: 'Categorized Task',
        description: 'Task with category and notes',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 15,
        creatorId: testUser.id,
        category: 'Development',
        notes: 'Important task notes here'
      };

      const task = await dataStore.createTask(taskData);

      expect(task.category).toBe('Development');
      expect(task.notes).toBe('Important task notes here');
    });
  });

  describe('Task Status Tests', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = await dataStore.createTask({
        title: 'Status Test Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });
    });

    it('should handle OPEN status', async () => {
      expect(testTask.status).toBe(TaskStatus.OPEN);
      expect(testTask.status).toBe('OPEN');
    });

    it('should transition from OPEN to IN_PROGRESS', async () => {
      const updatedTask = await dataStore.updateTask(testTask.id, { 
        status: TaskStatus.IN_PROGRESS 
      });

      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should transition from IN_PROGRESS to DONE', async () => {
      await dataStore.updateTask(testTask.id, { status: TaskStatus.IN_PROGRESS });
      const completedTask = await dataStore.updateTask(testTask.id, { 
        status: TaskStatus.DONE 
      });

      expect(completedTask).not.toBeNull();
      expect(completedTask!.status).toBe(TaskStatus.DONE);
    });

    it('should handle OVERDUE status', async () => {
      const overdueTask = await dataStore.updateTask(testTask.id, { 
        status: TaskStatus.OVERDUE 
      });

      expect(overdueTask).not.toBeNull();
      expect(overdueTask!.status).toBe(TaskStatus.OVERDUE);
    });

    it('should update many tasks status', async () => {
      // Create multiple open tasks with past due dates
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      await dataStore.createTask({
        title: 'Overdue Task 1',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        dueDate: pastDate,
        points: 10,
        creatorId: testUser.id
      });

      await dataStore.createTask({
        title: 'Overdue Task 2',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        dueDate: pastDate,
        points: 15,
        creatorId: testUser.id
      });

      const updateCount = await dataStore.updateManyTasks(
        { status: TaskStatus.OPEN, dueDate: new Date() },
        { status: TaskStatus.OVERDUE }
      );

      expect(updateCount).toBeGreaterThan(0);
    });
  });

  describe('Task Priority Tests', () => {
    it('should handle LOW priority', async () => {
      const task = await dataStore.createTask({
        title: 'Low Priority Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: testUser.id
      });

      expect(task.priority).toBe(TaskPriority.LOW);
      expect(task.priority).toBe('LOW');
    });

    it('should handle MEDIUM priority', async () => {
      const task = await dataStore.createTask({
        title: 'Medium Priority Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });

      expect(task.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should handle HIGH priority', async () => {
      const task = await dataStore.createTask({
        title: 'High Priority Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        points: 20,
        creatorId: testUser.id
      });

      expect(task.priority).toBe(TaskPriority.HIGH);
    });

    it('should handle URGENT priority', async () => {
      const task = await dataStore.createTask({
        title: 'Urgent Priority Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.URGENT,
        points: 30,
        creatorId: testUser.id
      });

      expect(task.priority).toBe(TaskPriority.URGENT);
    });
  });

  describe('Task Retrieval Tests', () => {
    let task1: Task, task2: Task, task3: Task;

    beforeEach(async () => {
      task1 = await dataStore.createTask({
        title: 'Task 1',
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH,
        points: 10,
        creatorId: testUser.id,
        groupId: testGroup.id
      });

      task2 = await dataStore.createTask({
        title: 'Task 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        points: 15,
        creatorId: testUser.id
      });

      task3 = await dataStore.createTask({
        title: 'Task 3',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: testUser.id,
        assigneeId: testUser.id
      });
    });

    it('should find task by id', async () => {
      const foundTask = await dataStore.findTaskById(task1.id);

      expect(foundTask).not.toBeNull();
      expect(foundTask!.id).toBe(task1.id);
      expect(foundTask!.title).toBe('Task 1');
    });

    it('should return null for non-existent task id', async () => {
      const foundTask = await dataStore.findTaskById('non-existent-id');
      expect(foundTask).toBeNull();
    });

    it('should find all tasks without filters', async () => {
      const allTasks = await dataStore.findAllTasks();
      expect(allTasks).toHaveLength(3);
    });

    it('should filter tasks by creator', async () => {
      const creatorTasks = await dataStore.findAllTasks({ creatorId: testUser.id });
      expect(creatorTasks).toHaveLength(3);
      expect(creatorTasks.every(task => task.creatorId === testUser.id)).toBe(true);
    });

    it('should filter tasks by assignee', async () => {
      const assigneeTasks = await dataStore.findAllTasks({ assigneeId: testUser.id });
      expect(assigneeTasks).toHaveLength(1);
      expect(assigneeTasks[0].id).toBe(task3.id);
    });

    it('should filter tasks by status', async () => {
      const openTasks = await dataStore.findAllTasks({ status: TaskStatus.OPEN });
      expect(openTasks).toHaveLength(1);
      expect(openTasks[0].id).toBe(task1.id);

      const inProgressTasks = await dataStore.findAllTasks({ status: TaskStatus.IN_PROGRESS });
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].id).toBe(task2.id);
    });

    it('should filter tasks by priority', async () => {
      const highPriorityTasks = await dataStore.findAllTasks({ priority: TaskPriority.HIGH });
      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].id).toBe(task1.id);
    });

    it('should filter tasks by group', async () => {
      const groupTasks = await dataStore.findAllTasks({ groupId: testGroup.id });
      expect(groupTasks).toHaveLength(1);
      expect(groupTasks[0].id).toBe(task1.id);
    });

    it('should filter tasks by multiple criteria', async () => {
      const filteredTasks = await dataStore.findAllTasks({
        creatorId: testUser.id,
        status: TaskStatus.OPEN,
        priority: TaskPriority.HIGH
      });
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].id).toBe(task1.id);
    });
  });

  describe('Task Due Date Validation Tests', () => {
    it('should create task with future due date', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const task = await dataStore.createTask({
        title: 'Future Due Date Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        dueDate: futureDate,
        points: 10,
        creatorId: testUser.id
      });

      expect(task.dueDate).toEqual(futureDate);
      expect(task.dueDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create task with past due date', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const task = await dataStore.createTask({
        title: 'Past Due Date Task',
        status: TaskStatus.OVERDUE,
        priority: TaskPriority.HIGH,
        dueDate: pastDate,
        points: 20,
        creatorId: testUser.id
      });

      expect(task.dueDate).toEqual(pastDate);
      expect(task.dueDate!.getTime()).toBeLessThan(Date.now());
    });

    it('should filter tasks by due date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await dataStore.createTask({
        title: 'Task Due Yesterday',
        status: TaskStatus.OVERDUE,
        priority: TaskPriority.HIGH,
        dueDate: yesterday,
        points: 10,
        creatorId: testUser.id
      });

      await dataStore.createTask({
        title: 'Task Due Tomorrow',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        dueDate: tomorrow,
        points: 10,
        creatorId: testUser.id
      });

      await dataStore.createTask({
        title: 'Task Due Next Week',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        dueDate: nextWeek,
        points: 10,
        creatorId: testUser.id
      });

      const tasksDueBefore = await dataStore.findAllTasks({ 
        dueBefore: new Date() 
      });
      expect(tasksDueBefore).toHaveLength(1);
      expect(tasksDueBefore[0].title).toBe('Task Due Yesterday');

      const tasksDueAfter = await dataStore.findAllTasks({ 
        dueAfter: new Date() 
      });
      expect(tasksDueAfter).toHaveLength(2);
    });
  });

  describe('Task Assignment Logic Tests', () => {
    let assigneeUser: User;

    beforeEach(async () => {
      assigneeUser = await dataStore.createUser({
        email: 'assignee@example.com',
        username: 'assigneeuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
    });

    it('should assign task to different user', async () => {
      const task = await dataStore.createTask({
        title: 'Assigned Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id,
        assigneeId: assigneeUser.id
      });

      expect(task.creatorId).toBe(testUser.id);
      expect(task.assigneeId).toBe(assigneeUser.id);
      expect(task.creatorId).not.toBe(task.assigneeId);
    });

    it('should allow self-assignment', async () => {
      const task = await dataStore.createTask({
        title: 'Self-Assigned Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id,
        assigneeId: testUser.id
      });

      expect(task.creatorId).toBe(testUser.id);
      expect(task.assigneeId).toBe(testUser.id);
    });

    it('should allow task without assignee', async () => {
      const task = await dataStore.createTask({
        title: 'Unassigned Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });

      expect(task.creatorId).toBe(testUser.id);
      expect(task.assigneeId).toBeUndefined();
    });

    it('should update task assignment', async () => {
      const task = await dataStore.createTask({
        title: 'Reassigned Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });

      const updatedTask = await dataStore.updateTask(task.id, {
        assigneeId: assigneeUser.id
      });

      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.assigneeId).toBe(assigneeUser.id);
    });
  });

  describe('Task Relations Tests', () => {
    let assigneeUser: User;
    let task: Task;

    beforeEach(async () => {
      assigneeUser = await dataStore.createUser({
        email: 'relations@example.com',
        username: 'relationsuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });

      task = await dataStore.createTask({
        title: 'Task with Relations',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id,
        assigneeId: assigneeUser.id,
        groupId: testGroup.id
      });
    });

    it('should get task with all relations', async () => {
      const taskWithRelations = await dataStore.getTaskWithRelations(task.id);

      expect(taskWithRelations).not.toBeNull();
      expect(taskWithRelations!.creator).toBeDefined();
      expect(taskWithRelations!.creator!.id).toBe(testUser.id);
      expect(taskWithRelations!.assignee).toBeDefined();
      expect(taskWithRelations!.assignee!.id).toBe(assigneeUser.id);
      expect(taskWithRelations!.group).toBeDefined();
      expect(taskWithRelations!.group!.id).toBe(testGroup.id);
    });

    it('should get multiple tasks with relations', async () => {
      const tasksWithRelations = await dataStore.getTasksWithRelations();

      expect(tasksWithRelations).toHaveLength(1);
      expect(tasksWithRelations[0].creator).toBeDefined();
      expect(tasksWithRelations[0].assignee).toBeDefined();
      expect(tasksWithRelations[0].group).toBeDefined();
    });

    it('should handle task without relations', async () => {
      const minimalTask = await dataStore.createTask({
        title: 'Minimal Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: testUser.id
      });

      const taskWithRelations = await dataStore.getTaskWithRelations(minimalTask.id);

      expect(taskWithRelations).not.toBeNull();
      expect(taskWithRelations!.creator).toBeDefined();
      expect(taskWithRelations!.assignee).toBeUndefined();
      expect(taskWithRelations!.group).toBeUndefined();
    });
  });

  describe('Task Update Tests', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = await dataStore.createTask({
        title: 'Original Task',
        description: 'Original description',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });
    });

    it('should update task title and description', async () => {
      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedTask = await dataStore.updateTask(testTask.id, {
        title: 'Updated Task',
        description: 'Updated description'
      });

      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.title).toBe('Updated Task');
      expect(updatedTask!.description).toBe('Updated description');
      expect(updatedTask!.updatedAt.getTime()).toBeGreaterThanOrEqual(testTask.updatedAt.getTime());
    });

    it('should update task status and priority', async () => {
      const updatedTask = await dataStore.updateTask(testTask.id, {
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH
      });

      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask!.priority).toBe(TaskPriority.HIGH);
    });

    it('should return null for non-existent task update', async () => {
      const updatedTask = await dataStore.updateTask('non-existent-id', {
        title: 'Updated Title'
      });
      expect(updatedTask).toBeNull();
    });
  });

  describe('Task Deletion Tests', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = await dataStore.createTask({
        title: 'Task to Delete',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });
    });

    it('should delete existing task', async () => {
      const result = await dataStore.deleteTask(testTask.id);

      expect(result).toBe(true);
      const deletedTask = await dataStore.findTaskById(testTask.id);
      expect(deletedTask).toBeNull();
    });

    it('should return false for non-existent task deletion', async () => {
      const result = await dataStore.deleteTask('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Task Points Management Tests', () => {
    it('should create tasks with different point values', async () => {
      const lowValueTask = await dataStore.createTask({
        title: 'Low Value Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.LOW,
        points: 5,
        creatorId: testUser.id
      });

      const highValueTask = await dataStore.createTask({
        title: 'High Value Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.URGENT,
        points: 50,
        creatorId: testUser.id
      });

      expect(lowValueTask.points).toBe(5);
      expect(highValueTask.points).toBe(50);
    });

    it('should update task points', async () => {
      const task = await dataStore.createTask({
        title: 'Points Task',
        status: TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM,
        points: 10,
        creatorId: testUser.id
      });

      const updatedTask = await dataStore.updateTask(task.id, {
        points: 25
      });

      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.points).toBe(25);
    });
  });
});

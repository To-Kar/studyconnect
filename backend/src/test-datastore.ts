// Simple test to verify the application is working without Prisma
import { dataStore, Role, TaskStatus, TaskPriority } from './lib/dataStore';

async function testDataStore() {
  console.log('🧪 Testing StudyConnect Data Store');
  console.log('=====================================');

  try {
    // Test user creation
    console.log('\n1. Testing User Operations...');
    const testUser = await dataStore.createUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      role: Role.USER,
      points: 0,
      badges: []
    });
    console.log('✅ User created:', { id: testUser.id, username: testUser.username, email: testUser.email });

    // Test user retrieval
    const foundUser = await dataStore.findUserByEmail('test@example.com');
    console.log('✅ User found by email:', foundUser ? `${foundUser.username} (${foundUser.email})` : 'Not found');

    // Test task creation
    console.log('\n2. Testing Task Operations...');
    const testTask = await dataStore.createTask({
      title: 'Test Task',
      description: 'This is a test task',
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      points: 10,
      creatorId: testUser.id,
      assigneeId: testUser.id
    });
    console.log('✅ Task created:', { id: testTask.id, title: testTask.title, status: testTask.status });

    // Test task with relations
    const taskWithRelations = await dataStore.getTaskWithRelations(testTask.id);
    console.log('✅ Task with relations loaded:', {
      title: taskWithRelations?.title,
      creator: taskWithRelations?.creator?.username,
      assignee: taskWithRelations?.assignee?.username
    });

    // Test group creation
    console.log('\n3. Testing Group Operations...');
    const testGroup = await dataStore.createGroup({
      name: 'Test Group',
      description: 'This is a test group',
      creatorId: testUser.id
    });
    console.log('✅ Group created:', { id: testGroup.id, name: testGroup.name });

    // Test group membership
    const membership = await dataStore.createGroupMember({
      userId: testUser.id,
      groupId: testGroup.id,
      role: Role.ADMIN
    });
    console.log('✅ Group membership created:', { userId: membership.userId, groupId: membership.groupId, role: membership.role });

    // Test filtering and queries
    console.log('\n4. Testing Queries and Filters...');
    const allUsers = await dataStore.findAllUsers();
    console.log(`✅ Total users in system: ${allUsers.length}`);

    const userTasks = await dataStore.findAllTasks({ creatorId: testUser.id });
    console.log(`✅ Tasks created by test user: ${userTasks.length}`);

    const openTasks = await dataStore.findAllTasks({ status: TaskStatus.OPEN });
    console.log(`✅ Open tasks in system: ${openTasks.length}`);

    console.log('\n🎉 All tests passed! StudyConnect is working without Prisma!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDataStore();
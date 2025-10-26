import { dataStore, Role, TaskStatus, TaskPriority } from './dataStore';
import bcrypt from 'bcryptjs';

export const seedData = async () => {
  console.log('🌱 Seeding initial data...');

  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const user1 = await dataStore.createUser({
      email: 'alice@example.com',
      username: 'alice',
      password: hashedPassword,
      role: Role.USER,
      points: 50,
      badges: ['Early Bird', 'Task Master']
    });

    const user2 = await dataStore.createUser({
      email: 'bob@example.com',
      username: 'bob',
      password: hashedPassword,
      role: Role.USER,
      points: 30,
      badges: ['Team Player']
    });

    const admin = await dataStore.createUser({
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: Role.ADMIN,
      points: 100,
      badges: ['Admin', 'Founder']
    });

    // Create sample groups
    const group1 = await dataStore.createGroup({
      name: 'Software Testing Study Group',
      description: 'A group for studying software testing concepts and practices',
      creatorId: user1.id
    });

    const group2 = await dataStore.createGroup({
      name: 'Mathematics Study Circle',
      description: 'Collaborative math problem solving',
      creatorId: user2.id
    });

    // Add members to groups
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
      userId: user2.id,
      groupId: group2.id,
      role: Role.ADMIN
    });

    await dataStore.createGroupMember({
      userId: admin.id,
      groupId: group2.id,
      role: Role.USER
    });

    // Create additional sample groups for testing
    const group3 = await dataStore.createGroup({
      name: 'Data Structures & Algorithms',
      description: 'Weekly problem-solving sessions for DSA preparation',
      creatorId: admin.id
    });

    const group4 = await dataStore.createGroup({
      name: 'Web Development Workshop',
      description: 'Learn modern web development technologies together',
      creatorId: user1.id
    });

    const group5 = await dataStore.createGroup({
      name: 'Machine Learning Reading Group',
      description: 'Discussing latest ML papers and implementing algorithms',
      creatorId: user2.id
    });

    // Add admin as member of group3
    await dataStore.createGroupMember({
      userId: admin.id,
      groupId: group3.id,
      role: Role.ADMIN
    });

    // Add alice as member of group4
    await dataStore.createGroupMember({
      userId: user1.id,
      groupId: group4.id,
      role: Role.ADMIN
    });

    // Add bob as member of group5
    await dataStore.createGroupMember({
      userId: user2.id,
      groupId: group5.id,
      role: Role.ADMIN
    });

    // Create sample tasks
    await dataStore.createTask({
      title: 'Review Unit Testing Concepts',
      description: 'Study the fundamentals of unit testing and write practice tests',
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      points: 20,
      creatorId: user1.id,
      assigneeId: user2.id,
      groupId: group1.id
    });

    await dataStore.createTask({
      title: 'Complete Integration Testing Lab',
      description: 'Implement integration tests for the API endpoints',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      points: 30,
      creatorId: user1.id,
      assigneeId: user1.id,
      groupId: group1.id
    });

    await dataStore.createTask({
      title: 'Prepare Presentation on BDD',
      description: 'Create slides and examples for Behavior-Driven Development presentation',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      points: 15,
      creatorId: user2.id,
      assigneeId: user2.id,
      groupId: group1.id
    });

    await dataStore.createTask({
      title: 'Solve Calculus Problem Set 5',
      description: 'Work through the assigned calculus problems for next week',
      status: TaskStatus.OPEN,
      priority: TaskPriority.URGENT,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      points: 25,
      creatorId: user2.id,
      assigneeId: admin.id,
      groupId: group2.id
    });

    await dataStore.createTask({
      title: 'Individual Research Project',
      description: 'Research and document findings on testing automation tools',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      points: 40,
      creatorId: admin.id,
      assigneeId: admin.id
    });

    console.log('✅ Sample data seeded successfully!');
    console.log(`👥 Users created: ${[user1, user2, admin].length}`);
    console.log(`👥 Groups created: ${[group1, group2, group3, group4, group5].length}`);
    console.log(`📋 Tasks created: 5`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};
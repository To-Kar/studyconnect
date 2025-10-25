"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = void 0;
const dataStore_1 = require("./dataStore");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedData = async () => {
    console.log('🌱 Seeding initial data...');
    try {
        // Create sample users
        const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
        const user1 = await dataStore_1.dataStore.createUser({
            email: 'alice@example.com',
            username: 'alice',
            password: hashedPassword,
            role: dataStore_1.Role.USER,
            points: 50,
            badges: ['Early Bird', 'Task Master']
        });
        const user2 = await dataStore_1.dataStore.createUser({
            email: 'bob@example.com',
            username: 'bob',
            password: hashedPassword,
            role: dataStore_1.Role.USER,
            points: 30,
            badges: ['Team Player']
        });
        const admin = await dataStore_1.dataStore.createUser({
            email: 'admin@example.com',
            username: 'admin',
            password: hashedPassword,
            role: dataStore_1.Role.ADMIN,
            points: 100,
            badges: ['Admin', 'Founder']
        });
        // Create sample groups
        const group1 = await dataStore_1.dataStore.createGroup({
            name: 'Software Testing Study Group',
            description: 'A group for studying software testing concepts and practices',
            creatorId: user1.id
        });
        const group2 = await dataStore_1.dataStore.createGroup({
            name: 'Mathematics Study Circle',
            description: 'Collaborative math problem solving',
            creatorId: user2.id
        });
        // Add members to groups
        await dataStore_1.dataStore.createGroupMember({
            userId: user1.id,
            groupId: group1.id,
            role: dataStore_1.Role.ADMIN
        });
        await dataStore_1.dataStore.createGroupMember({
            userId: user2.id,
            groupId: group1.id,
            role: dataStore_1.Role.USER
        });
        await dataStore_1.dataStore.createGroupMember({
            userId: user2.id,
            groupId: group2.id,
            role: dataStore_1.Role.ADMIN
        });
        await dataStore_1.dataStore.createGroupMember({
            userId: admin.id,
            groupId: group2.id,
            role: dataStore_1.Role.USER
        });
        // Create sample tasks
        await dataStore_1.dataStore.createTask({
            title: 'Review Unit Testing Concepts',
            description: 'Study the fundamentals of unit testing and write practice tests',
            status: dataStore_1.TaskStatus.OPEN,
            priority: dataStore_1.TaskPriority.HIGH,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            points: 20,
            creatorId: user1.id,
            assigneeId: user2.id,
            groupId: group1.id
        });
        await dataStore_1.dataStore.createTask({
            title: 'Complete Integration Testing Lab',
            description: 'Implement integration tests for the API endpoints',
            status: dataStore_1.TaskStatus.IN_PROGRESS,
            priority: dataStore_1.TaskPriority.MEDIUM,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            points: 30,
            creatorId: user1.id,
            assigneeId: user1.id,
            groupId: group1.id
        });
        await dataStore_1.dataStore.createTask({
            title: 'Prepare Presentation on BDD',
            description: 'Create slides and examples for Behavior-Driven Development presentation',
            status: dataStore_1.TaskStatus.DONE,
            priority: dataStore_1.TaskPriority.LOW,
            points: 15,
            creatorId: user2.id,
            assigneeId: user2.id,
            groupId: group1.id
        });
        await dataStore_1.dataStore.createTask({
            title: 'Solve Calculus Problem Set 5',
            description: 'Work through the assigned calculus problems for next week',
            status: dataStore_1.TaskStatus.OPEN,
            priority: dataStore_1.TaskPriority.URGENT,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            points: 25,
            creatorId: user2.id,
            assigneeId: admin.id,
            groupId: group2.id
        });
        await dataStore_1.dataStore.createTask({
            title: 'Individual Research Project',
            description: 'Research and document findings on testing automation tools',
            status: dataStore_1.TaskStatus.IN_PROGRESS,
            priority: dataStore_1.TaskPriority.MEDIUM,
            points: 40,
            creatorId: admin.id,
            assigneeId: admin.id
        });
        console.log('✅ Sample data seeded successfully!');
        console.log(`👥 Users created: ${[user1, user2, admin].length}`);
        console.log(`👥 Groups created: ${[group1, group2].length}`);
        console.log(`📋 Tasks created: 5`);
    }
    catch (error) {
        console.error('❌ Error seeding data:', error);
    }
};
exports.seedData = seedData;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataStore = exports.TaskPriority = exports.TaskStatus = exports.Role = void 0;
const uuid_1 = require("uuid");
// Enums
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["OPEN"] = "OPEN";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["OVERDUE"] = "OVERDUE";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
// In-memory data storage
class DataStore {
    constructor() {
        this.users = [];
        this.groups = [];
        this.groupMembers = [];
        this.tasks = [];
    }
    // User methods
    async createUser(userData) {
        const user = {
            ...userData,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.push(user);
        return user;
    }
    async findUserById(id) {
        return this.users.find(user => user.id === id) || null;
    }
    async findUserByEmail(email) {
        return this.users.find(user => user.email === email) || null;
    }
    async findUserByUsername(username) {
        return this.users.find(user => user.username === username) || null;
    }
    async findUserByEmailOrUsername(email, username) {
        return this.users.find(user => user.email === email || user.username === username) || null;
    }
    async findAllUsers() {
        return this.users;
    }
    async updateUser(id, updateData) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1)
            return null;
        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updateData,
            updatedAt: new Date()
        };
        return this.users[userIndex];
    }
    async deleteUser(id) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1)
            return false;
        this.users.splice(userIndex, 1);
        // Also remove related data
        this.tasks = this.tasks.filter(task => task.creatorId !== id && task.assigneeId !== id);
        this.groupMembers = this.groupMembers.filter(member => member.userId !== id);
        this.groups = this.groups.filter(group => group.creatorId !== id);
        return true;
    }
    // Group methods
    async createGroup(groupData) {
        const group = {
            ...groupData,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.groups.push(group);
        return group;
    }
    async findGroupById(id) {
        return this.groups.find(group => group.id === id) || null;
    }
    async findAllGroups() {
        return this.groups;
    }
    async updateGroup(id, updateData) {
        const groupIndex = this.groups.findIndex(group => group.id === id);
        if (groupIndex === -1)
            return null;
        this.groups[groupIndex] = {
            ...this.groups[groupIndex],
            ...updateData,
            updatedAt: new Date()
        };
        return this.groups[groupIndex];
    }
    async deleteGroup(id) {
        const groupIndex = this.groups.findIndex(group => group.id === id);
        if (groupIndex === -1)
            return false;
        this.groups.splice(groupIndex, 1);
        // Also remove related data
        this.groupMembers = this.groupMembers.filter(member => member.groupId !== id);
        this.tasks = this.tasks.filter(task => task.groupId !== id);
        return true;
    }
    // GroupMember methods
    async createGroupMember(memberData) {
        const member = {
            ...memberData,
            id: (0, uuid_1.v4)(),
            joinedAt: new Date()
        };
        this.groupMembers.push(member);
        return member;
    }
    async findGroupMembersByGroupId(groupId) {
        return this.groupMembers.filter(member => member.groupId === groupId);
    }
    async findGroupMembersByUserId(userId) {
        return this.groupMembers.filter(member => member.userId === userId);
    }
    async findGroupMember(userId, groupId) {
        return this.groupMembers.find(member => member.userId === userId && member.groupId === groupId) || null;
    }
    async deleteGroupMember(userId, groupId) {
        const memberIndex = this.groupMembers.findIndex(member => member.userId === userId && member.groupId === groupId);
        if (memberIndex === -1)
            return false;
        this.groupMembers.splice(memberIndex, 1);
        return true;
    }
    // Task methods
    async createTask(taskData) {
        const task = {
            ...taskData,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.tasks.push(task);
        return task;
    }
    async findTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }
    async findAllTasks(filters) {
        let filteredTasks = this.tasks;
        if (filters) {
            if (filters.creatorId) {
                filteredTasks = filteredTasks.filter(task => task.creatorId === filters.creatorId);
            }
            if (filters.assigneeId) {
                filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId);
            }
            if (filters.groupId) {
                filteredTasks = filteredTasks.filter(task => task.groupId === filters.groupId);
            }
            if (filters.status) {
                filteredTasks = filteredTasks.filter(task => task.status === filters.status);
            }
            if (filters.priority) {
                filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
            }
        }
        return filteredTasks;
    }
    async updateTask(id, updateData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1)
            return null;
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updateData,
            updatedAt: new Date()
        };
        return this.tasks[taskIndex];
    }
    async updateManyTasks(filters, updateData) {
        let updatedCount = 0;
        this.tasks.forEach((task, index) => {
            let shouldUpdate = true;
            if (filters.dueDate && (!task.dueDate || task.dueDate >= filters.dueDate)) {
                shouldUpdate = false;
            }
            if (filters.status && task.status !== filters.status) {
                shouldUpdate = false;
            }
            if (shouldUpdate) {
                this.tasks[index] = {
                    ...task,
                    ...updateData,
                    updatedAt: new Date()
                };
                updatedCount++;
            }
        });
        return updatedCount;
    }
    async deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1)
            return false;
        this.tasks.splice(taskIndex, 1);
        return true;
    }
    // Helper methods for relations
    async getTaskWithRelations(id) {
        const task = await this.findTaskById(id);
        if (!task)
            return null;
        const creator = await this.findUserById(task.creatorId);
        const assignee = task.assigneeId ? await this.findUserById(task.assigneeId) : null;
        const group = task.groupId ? await this.findGroupById(task.groupId) : null;
        return {
            ...task,
            creator: creator || undefined,
            assignee: assignee || undefined,
            group: group || undefined
        };
    }
    async getTasksWithRelations(filters) {
        const tasks = await this.findAllTasks(filters);
        const tasksWithRelations = await Promise.all(tasks.map(async (task) => {
            const creator = await this.findUserById(task.creatorId);
            const assignee = task.assigneeId ? await this.findUserById(task.assigneeId) : null;
            const group = task.groupId ? await this.findGroupById(task.groupId) : null;
            return {
                ...task,
                creator: creator || undefined,
                assignee: assignee || undefined,
                group: group || undefined
            };
        }));
        return tasksWithRelations;
    }
}
// Create singleton instance
exports.dataStore = new DataStore();

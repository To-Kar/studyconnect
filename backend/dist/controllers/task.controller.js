"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getMyTasks = exports.getTasks = exports.createTask = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const dataStore_1 = require("../lib/dataStore");
// Helper function to check overdue tasks
const checkAndUpdateOverdue = async () => {
    const now = new Date();
    await dataStore_1.dataStore.updateManyTasks({ dueDate: now, status: dataStore_1.TaskStatus.OPEN }, { status: dataStore_1.TaskStatus.OVERDUE });
    await dataStore_1.dataStore.updateManyTasks({ dueDate: now, status: dataStore_1.TaskStatus.IN_PROGRESS }, { status: dataStore_1.TaskStatus.OVERDUE });
};
const createTask = async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, assigneeId, groupId } = req.body;
        if (!title) {
            throw new error_middleware_1.AppError('Task title is required', 400);
        }
        const task = await dataStore_1.dataStore.createTask({
            title,
            description,
            priority: priority || dataStore_1.TaskPriority.MEDIUM,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            creatorId: req.user.id,
            assigneeId: assigneeId || req.user.id,
            groupId,
            status: dataStore_1.TaskStatus.OPEN,
            points: 10
        });
        const taskWithRelations = await dataStore_1.dataStore.getTaskWithRelations(task.id);
        res.status(201).json({
            status: 'success',
            data: { task: taskWithRelations }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
const getTasks = async (req, res, next) => {
    try {
        await checkAndUpdateOverdue();
        const { groupId, status, priority } = req.query;
        const filters = {};
        if (groupId) {
            filters.groupId = groupId;
        }
        if (status) {
            filters.status = status;
        }
        if (priority) {
            filters.priority = priority;
        }
        const tasks = await dataStore_1.dataStore.getTasksWithRelations(filters);
        // Sort by createdAt desc
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
const getMyTasks = async (req, res, next) => {
    try {
        await checkAndUpdateOverdue();
        // Get tasks created by user
        const createdTasks = await dataStore_1.dataStore.getTasksWithRelations({ creatorId: req.user.id });
        // Get tasks assigned to user
        const assignedTasks = await dataStore_1.dataStore.getTasksWithRelations({ assigneeId: req.user.id });
        // Combine and deduplicate tasks
        const taskMap = new Map();
        [...createdTasks, ...assignedTasks].forEach(task => {
            taskMap.set(task.id, task);
        });
        const tasks = Array.from(taskMap.values());
        // Sort by createdAt desc
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTasks = getMyTasks;
const getTaskById = async (req, res, next) => {
    try {
        const task = await dataStore_1.dataStore.getTaskWithRelations(req.params.id);
        if (!task) {
            throw new error_middleware_1.AppError('Task not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, dueDate, assigneeId } = req.body;
        const existingTask = await dataStore_1.dataStore.findTaskById(req.params.id);
        if (!existingTask) {
            throw new error_middleware_1.AppError('Task not found', 404);
        }
        // Award points if task is completed
        let pointsAwarded = false;
        if (status === dataStore_1.TaskStatus.DONE && existingTask.status !== dataStore_1.TaskStatus.DONE) {
            const userId = existingTask.assigneeId || existingTask.creatorId;
            const user = await dataStore_1.dataStore.findUserById(userId);
            if (user) {
                await dataStore_1.dataStore.updateUser(userId, {
                    points: user.points + existingTask.points
                });
                pointsAwarded = true;
            }
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (status !== undefined)
            updateData.status = status;
        if (priority !== undefined)
            updateData.priority = priority;
        if (dueDate !== undefined)
            updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (assigneeId !== undefined)
            updateData.assigneeId = assigneeId;
        await dataStore_1.dataStore.updateTask(req.params.id, updateData);
        const task = await dataStore_1.dataStore.getTaskWithRelations(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { task, pointsAwarded }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res, next) => {
    try {
        const task = await dataStore_1.dataStore.findTaskById(req.params.id);
        if (!task) {
            throw new error_middleware_1.AppError('Task not found', 404);
        }
        if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('Not authorized to delete this task', 403);
        }
        await dataStore_1.dataStore.deleteTask(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTask = deleteTask;

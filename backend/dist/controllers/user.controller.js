"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const dataStore_1 = require("../lib/dataStore");
const getUsers = async (req, res, next) => {
    try {
        const allUsers = await dataStore_1.dataStore.findAllUsers();
        // Sort by points descending
        const users = allUsers
            .sort((a, b) => b.points - a.points)
            .map(user => ({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            points: user.points,
            badges: user.badges,
            createdAt: user.createdAt
        }));
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res, next) => {
    try {
        const user = await dataStore_1.dataStore.findUserById(req.params.id);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        // Get assigned tasks for this user
        const assignedTasks = await dataStore_1.dataStore.findAllTasks({ assigneeId: req.params.id });
        const userWithTasks = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            points: user.points,
            badges: user.badges,
            createdAt: user.createdAt,
            assignedTasks: assignedTasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate
            }))
        };
        res.status(200).json({
            status: 'success',
            data: { user: userWithTasks }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res, next) => {
    try {
        const { username, badges } = req.body;
        // Users can only update their own profile unless they're admin
        if (req.params.id !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('Not authorized to update this user', 403);
        }
        const user = await dataStore_1.dataStore.updateUser(req.params.id, {
            username,
            badges
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    points: user.points,
                    badges: user.badges,
                    updatedAt: user.updatedAt
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.addMember = exports.deleteGroup = exports.updateGroup = exports.getGroupById = exports.getGroups = exports.createGroup = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const dataStore_1 = require("../lib/dataStore");
const createGroup = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            throw new error_middleware_1.AppError('Group name is required', 400);
        }
        const group = await dataStore_1.dataStore.createGroup({
            name,
            description,
            creatorId: req.user.id
        });
        // Add creator as admin member
        await dataStore_1.dataStore.createGroupMember({
            userId: req.user.id,
            groupId: group.id,
            role: dataStore_1.Role.ADMIN
        });
        const creator = await dataStore_1.dataStore.findUserById(req.user.id);
        res.status(201).json({
            status: 'success',
            data: {
                group: {
                    ...group,
                    creator: creator ? {
                        id: creator.id,
                        username: creator.username,
                        email: creator.email
                    } : undefined
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createGroup = createGroup;
const getGroups = async (req, res, next) => {
    try {
        // Get groups where user is a member
        const userMemberships = await dataStore_1.dataStore.findGroupMembersByUserId(req.user.id);
        const userGroupIds = userMemberships.map(membership => membership.groupId);
        const allGroups = await dataStore_1.dataStore.findAllGroups();
        const userGroups = allGroups.filter(group => userGroupIds.includes(group.id));
        // Sort by createdAt desc
        userGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Get additional data for each group
        const groupsWithData = await Promise.all(userGroups.map(async (group) => {
            const creator = await dataStore_1.dataStore.findUserById(group.creatorId);
            const members = await dataStore_1.dataStore.findGroupMembersByGroupId(group.id);
            const tasks = await dataStore_1.dataStore.findAllTasks({ groupId: group.id });
            return {
                ...group,
                creator: creator ? {
                    id: creator.id,
                    username: creator.username,
                    email: creator.email
                } : undefined,
                members: await Promise.all(members.map(async (member) => {
                    const user = await dataStore_1.dataStore.findUserById(member.userId);
                    return user ? {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: member.role
                    } : null;
                })).then(users => users.filter(Boolean)),
                tasks: tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate
                }))
            };
        }));
        res.status(200).json({
            status: 'success',
            results: groupsWithData.length,
            data: { groups: groupsWithData }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGroups = getGroups;
const getGroupById = async (req, res, next) => {
    try {
        const group = await dataStore_1.dataStore.findGroupById(req.params.id);
        if (!group) {
            throw new error_middleware_1.AppError('Group not found', 404);
        }
        const creator = await dataStore_1.dataStore.findUserById(group.creatorId);
        const members = await dataStore_1.dataStore.findGroupMembersByGroupId(group.id);
        const tasks = await dataStore_1.dataStore.getTasksWithRelations({ groupId: group.id });
        const membersWithUsers = await Promise.all(members.map(async (member) => {
            const user = await dataStore_1.dataStore.findUserById(member.userId);
            return user ? {
                id: user.id,
                username: user.username,
                email: user.email,
                role: member.role
            } : null;
        }));
        const groupWithData = {
            ...group,
            creator: creator ? {
                id: creator.id,
                username: creator.username,
                email: creator.email
            } : undefined,
            members: membersWithUsers.filter(Boolean),
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                creator: task.creator ? {
                    id: task.creator.id,
                    username: task.creator.username
                } : undefined,
                assignee: task.assignee ? {
                    id: task.assignee.id,
                    username: task.assignee.username
                } : undefined
            }))
        };
        res.status(200).json({
            status: 'success',
            data: { group: groupWithData }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGroupById = getGroupById;
const updateGroup = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const group = await dataStore_1.dataStore.updateGroup(req.params.id, {
            name,
            description
        });
        if (!group) {
            throw new error_middleware_1.AppError('Group not found', 404);
        }
        const creator = await dataStore_1.dataStore.findUserById(group.creatorId);
        const members = await dataStore_1.dataStore.findGroupMembersByGroupId(group.id);
        const membersWithUsers = await Promise.all(members.map(async (member) => {
            const user = await dataStore_1.dataStore.findUserById(member.userId);
            return user ? {
                id: user.id,
                username: user.username,
                email: user.email
            } : null;
        }));
        res.status(200).json({
            status: 'success',
            data: {
                group: {
                    ...group,
                    creator: creator ? {
                        id: creator.id,
                        username: creator.username,
                        email: creator.email
                    } : undefined,
                    members: membersWithUsers.filter(Boolean)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGroup = updateGroup;
const deleteGroup = async (req, res, next) => {
    try {
        const group = await dataStore_1.dataStore.findGroupById(req.params.id);
        if (!group) {
            throw new error_middleware_1.AppError('Group not found', 404);
        }
        if (group.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('Not authorized to delete this group', 403);
        }
        await dataStore_1.dataStore.deleteGroup(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGroup = deleteGroup;
const addMember = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        const groupId = req.params.id;
        if (!userId) {
            throw new error_middleware_1.AppError('User ID is required', 400);
        }
        // Check if user exists
        const user = await dataStore_1.dataStore.findUserById(userId);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        // Check if user is already a member
        const existingMember = await dataStore_1.dataStore.findGroupMember(userId, groupId);
        if (existingMember) {
            throw new error_middleware_1.AppError('User is already a member of this group', 409);
        }
        const member = await dataStore_1.dataStore.createGroupMember({
            userId,
            groupId,
            role: role || dataStore_1.Role.USER
        });
        res.status(201).json({
            status: 'success',
            data: {
                member: {
                    ...member,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addMember = addMember;
const removeMember = async (req, res, next) => {
    try {
        const { id: groupId, userId } = req.params;
        const member = await dataStore_1.dataStore.findGroupMember(userId, groupId);
        if (!member) {
            throw new error_middleware_1.AppError('Member not found in this group', 404);
        }
        await dataStore_1.dataStore.deleteGroupMember(userId, groupId);
        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeMember = removeMember;

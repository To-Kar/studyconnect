import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { dataStore, Role } from '../lib/databaseService';

export const createGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Group name is required', 400);
    }

    const group = await dataStore.createGroup({
      name,
      description,
      creatorId: req.user!.id
    });

    // Add creator as admin member
    await dataStore.createGroupMember({
      userId: req.user!.id,
      groupId: group.id,
      role: Role.ADMIN
    });

    const creator = await dataStore.findUserById(req.user!.id);

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
  } catch (error) {
    next(error);
  }
};

export const getGroups = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get groups where user is a member
    const userMemberships = await dataStore.findGroupMembersByUserId(req.user!.id);
    const userGroupIds = userMemberships.map(membership => membership.groupId);

    const allGroups = await dataStore.findAllGroups();
    const userGroups = allGroups.filter(group => userGroupIds.includes(group.id));

    // Sort by createdAt desc
    userGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get additional data for each group
    const groupsWithData = await Promise.all(
      userGroups.map(async (group) => {
        const creator = await dataStore.findUserById(group.creatorId);
        const members = await dataStore.findGroupMembersByGroupId(group.id);
        const tasks = await dataStore.findAllTasks({ groupId: group.id });
        
        return {
          ...group,
          creator: creator ? {
            id: creator.id,
            username: creator.username,
            email: creator.email
          } : undefined,
          members: await Promise.all(
            members.map(async (member) => {
              const user = await dataStore.findUserById(member.userId);
              return user ? {
                id: user.id,
                username: user.username,
                email: user.email,
                role: member.role
              } : null;
            })
          ).then(users => users.filter(Boolean)),
          tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate
          }))
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: groupsWithData.length,
      data: { groups: groupsWithData }
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await dataStore.findGroupById(req.params.id);

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const creator = await dataStore.findUserById(group.creatorId);
    const members = await dataStore.findGroupMembersByGroupId(group.id);
    const tasks = await dataStore.getTasksWithRelations({ groupId: group.id });

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await dataStore.findUserById(member.userId);
        return user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: member.role
        } : null;
      })
    );

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
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    const group = await dataStore.updateGroup(req.params.id, {
      name,
      description
    });

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const creator = await dataStore.findUserById(group.creatorId);
    const members = await dataStore.findGroupMembersByGroupId(group.id);
    
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await dataStore.findUserById(member.userId);
        return user ? {
          id: user.id,
          username: user.username,
          email: user.email
        } : null;
      })
    );

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
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await dataStore.findGroupById(req.params.id);

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Not authorized to delete this group', 403);
    }

    await dataStore.deleteGroup(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, role } = req.body;
    const groupId = req.params.id;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    // Check if user exists
    const user = await dataStore.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is already a member
    const existingMember = await dataStore.findGroupMember(userId, groupId);
    if (existingMember) {
      throw new AppError('User is already a member of this group', 409);
    }

    const member = await dataStore.createGroupMember({
      userId,
      groupId,
      role: role || Role.USER
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
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: groupId, userId } = req.params;

    const member = await dataStore.findGroupMember(userId, groupId);

    if (!member) {
      throw new AppError('Member not found in this group', 404);
    }

    await dataStore.deleteGroupMember(userId, groupId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getAllGroups = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allGroups = await dataStore.findAllGroups();
    const userMemberships = await dataStore.findGroupMembersByUserId(req.user!.id);
    const userGroupIds = userMemberships.map(membership => membership.groupId);

    // Sort by createdAt desc
    allGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get additional data for each group
    const groupsWithData = await Promise.all(
      allGroups.map(async (group) => {
        const creator = await dataStore.findUserById(group.creatorId);
        const members = await dataStore.findGroupMembersByGroupId(group.id);
        const tasks = await dataStore.findAllTasks({ groupId: group.id });
        
        const isMember = userGroupIds.includes(group.id);
        const userMembership = userMemberships.find(m => m.groupId === group.id);
        
        return {
          ...group,
          isMember,
          userRole: userMembership?.role || null,
          creator: creator ? {
            id: creator.id,
            username: creator.username,
            email: creator.email
          } : undefined,
          memberCount: members.length,
          taskCount: tasks.length,
          members: await Promise.all(
            members.map(async (member) => {
              const user = await dataStore.findUserById(member.userId);
              return user ? {
                id: user.id,
                username: user.username,
                email: user.email,
                role: member.role
              } : null;
            })
          ).then(users => users.filter(Boolean))
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: groupsWithData.length,
      data: { groups: groupsWithData }
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;

    // Check if group exists
    const group = await dataStore.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Check if user is already a member
    const existingMember = await dataStore.findGroupMember(userId, groupId);
    if (existingMember) {
      throw new AppError('You are already a member of this group', 409);
    }

    // Add user as regular member
    const member = await dataStore.createGroupMember({
      userId,
      groupId,
      role: Role.USER
    });

    const user = await dataStore.findUserById(userId);

    res.status(201).json({
      status: 'success',
      message: 'Successfully joined group',
      data: { 
        member: {
          ...member,
          user: {
            id: user!.id,
            username: user!.username,
            email: user!.email
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;

    const group = await dataStore.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Don't allow creator to leave their own group
    if (group.creatorId === userId) {
      throw new AppError('Group creators cannot leave their own group. Delete the group instead.', 400);
    }

    const member = await dataStore.findGroupMember(userId, groupId);
    if (!member) {
      throw new AppError('You are not a member of this group', 404);
    }

    await dataStore.deleteGroupMember(userId, groupId);

    res.status(200).json({
      status: 'success',
      message: 'Successfully left group'
    });
  } catch (error) {
    next(error);
  }
};

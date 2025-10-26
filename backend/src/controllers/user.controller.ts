import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { dataStore } from '../lib/dataStore';

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allUsers = await dataStore.findAllUsers();
    
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
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await dataStore.findUserById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get assigned tasks for this user
    const assignedTasks = await dataStore.findAllTasks({ assigneeId: req.params.id });
    
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
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, badges } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.params.id !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Not authorized to update this user', 403);
    }

    const user = await dataStore.updateUser(req.params.id, {
      username,
      badges
    });

    if (!user) {
      throw new AppError('User not found', 404);
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
  } catch (error) {
    next(error);
  }
};

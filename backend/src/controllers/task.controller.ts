import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { dataStore, TaskStatus, TaskPriority } from '../lib/databaseService';

// Helper function to check overdue tasks
const checkAndUpdateOverdue = async () => {
  const now = new Date();
  await dataStore.updateManyTasks(
    { dueDate: now, status: TaskStatus.OPEN },
    { status: TaskStatus.OVERDUE }
  );
  await dataStore.updateManyTasks(
    { dueDate: now, status: TaskStatus.IN_PROGRESS },
    { status: TaskStatus.OVERDUE }
  );
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, priority, dueDate, assigneeId, groupId } = req.body;

    if (!title) {
      throw new AppError('Task title is required', 400);
    }

    const task = await dataStore.createTask({
      title,
      description,
      priority: priority || TaskPriority.MEDIUM,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      creatorId: req.user!.id,
      assigneeId: assigneeId || req.user!.id,
      groupId,
      status: TaskStatus.OPEN,
      points: 10
    });

    const taskWithRelations = await dataStore.getTaskWithRelations(task.id);

    res.status(201).json({
      status: 'success',
      data: { task: taskWithRelations }
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await checkAndUpdateOverdue();

    const { groupId, status, priority } = req.query;

    const filters: any = {};

    if (groupId) {
      filters.groupId = groupId as string;
    }

    if (status) {
      filters.status = status as TaskStatus;
    }

    if (priority) {
      filters.priority = priority as TaskPriority;
    }

    const tasks = await dataStore.getTasksWithRelations(filters);
    
    // Sort by createdAt desc
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await checkAndUpdateOverdue();

    // Get tasks created by user
    const createdTasks = await dataStore.getTasksWithRelations({ creatorId: req.user!.id });
    
    // Get tasks assigned to user
    const assignedTasks = await dataStore.getTasksWithRelations({ assigneeId: req.user!.id });
    
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
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await dataStore.getTaskWithRelations(req.params.id);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const existingTask = await dataStore.findTaskById(req.params.id);

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // Award points if task is completed
    let pointsAwarded = false;
    if (status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
      const userId = existingTask.assigneeId || existingTask.creatorId;
      const user = await dataStore.findUserById(userId);
      if (user) {
        await dataStore.updateUser(userId, {
          points: user.points + existingTask.points
        });
        pointsAwarded = true;
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    await dataStore.updateTask(req.params.id, updateData);
    
    const task = await dataStore.getTaskWithRelations(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { task, pointsAwarded }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await dataStore.findTaskById(req.params.id);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Not authorized to delete this task', 403);
    }

    await dataStore.deleteTask(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

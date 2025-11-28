import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { dataStore } from '../lib/databaseService';

export const listNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await dataStore.findNotificationsByUserId(req.user!.id, unreadOnly);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, title, message, taskId, userId } = req.body;

    if (!type || !title || !message) {
      throw new AppError('type, title, and message are required', 400);
    }

    const notification = await dataStore.createNotification({
      userId: userId || req.user!.id,
      type,
      title,
      message,
      read: false,
      taskId
    });

    res.status(201).json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const notifications = await dataStore.findNotificationsByUserId(req.user!.id);
    const target = notifications.find(n => n.id === id);
    if (!target) {
      throw new AppError('Notification not found', 404);
    }

    await dataStore.markNotificationAsRead(id);

    res.status(200).json({
      status: 'success',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

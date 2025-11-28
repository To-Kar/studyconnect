import { exportTasksICS, addTaskComment, getTaskComments, deleteTaskComment } from '../controllers/task.controller';
import { listNotifications, createNotification, markNotificationRead } from '../controllers/notification.controller';
import { TaskStatus, TaskPriority } from '../lib/databaseService';
import { AppError } from '../middleware/error.middleware';

jest.mock('../lib/databaseService', () => {
  const TaskStatus = { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE', OVERDUE: 'OVERDUE' };
  const TaskPriority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' };
  return {
    TaskStatus,
    TaskPriority,
    dataStore: {
      getTasksWithRelations: jest.fn(),
      findTaskById: jest.fn(),
      createTaskComment: jest.fn(),
      findTaskCommentsByTaskId: jest.fn(),
      deleteTaskComment: jest.fn(),
      findNotificationsByUserId: jest.fn(),
      createNotification: jest.fn(),
      markNotificationAsRead: jest.fn()
    }
  };
});

const { dataStore } = require('../lib/databaseService');

const mockRes = () => {
  const res: any = {};
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('Controller extras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportTasksICS', () => {
    it('returns ICS content with due tasks', async () => {
      const due = new Date('2025-01-01T12:00:00Z');
      (dataStore.getTasksWithRelations as jest.Mock).mockResolvedValue([
        { id: 't1', title: 'Task One', description: 'Desc', dueDate: due },
        { id: 't2', title: 'No Due', description: '', dueDate: undefined }
      ]);

      const req: any = { user: { id: 'u1' } };
      const res = mockRes();
      const next = mockNext();

      await exportTasksICS(req, res as any, next);

      expect(dataStore.getTasksWithRelations).toHaveBeenCalledWith({ assigneeId: 'u1' });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('tasks.ics'));
      const payload = (res.send as jest.Mock).mock.calls[0][0] as string;
      expect(payload).toContain('BEGIN:VCALENDAR');
      expect(payload).toContain('SUMMARY:Task One');
      expect(payload).toContain('UID:t1@studyconnect');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Task comments', () => {
    it('adds a task comment when task exists', async () => {
      (dataStore.findTaskById as jest.Mock).mockResolvedValue({ id: 't1' });
      (dataStore.createTaskComment as jest.Mock).mockResolvedValue({ id: 'c1', content: 'Hi' });
      const req: any = { params: { id: 't1' }, body: { content: 'Hi' }, user: { id: 'u1' } };
      const res = mockRes();
      const next = mockNext();

      await addTaskComment(req, res as any, next);

      expect(dataStore.createTaskComment).toHaveBeenCalledWith({ taskId: 't1', userId: 'u1', content: 'Hi' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('retrieves task comments for a task', async () => {
      (dataStore.findTaskById as jest.Mock).mockResolvedValue({ id: 't1' });
      (dataStore.findTaskCommentsByTaskId as jest.Mock).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      const req: any = { params: { id: 't1' } };
      const res = mockRes();
      const next = mockNext();

      await getTaskComments(req, res as any, next);

      expect(dataStore.findTaskCommentsByTaskId).toHaveBeenCalledWith('t1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ results: 2 }));
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes a task comment when authorized', async () => {
      (dataStore.findTaskCommentsByTaskId as jest.Mock).mockResolvedValue([
        { id: 'c1', userId: 'u1' }
      ]);
      (dataStore.deleteTaskComment as jest.Mock).mockResolvedValue(true);
      const req: any = { params: { id: 't1', commentId: 'c1' }, user: { id: 'u1', role: 'USER' } };
      const res = mockRes();
      const next = mockNext();

      await deleteTaskComment(req, res as any, next);

      expect(dataStore.deleteTaskComment).toHaveBeenCalledWith('c1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects delete when comment missing', async () => {
      (dataStore.findTaskCommentsByTaskId as jest.Mock).mockResolvedValue([]);
      const req: any = { params: { id: 't1', commentId: 'missing' }, user: { id: 'u1', role: 'USER' } };
      const res = mockRes();
      const next = mockNext();

      await deleteTaskComment(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('Notifications', () => {
    it('lists notifications with unreadOnly filter', async () => {
      (dataStore.findNotificationsByUserId as jest.Mock).mockResolvedValue([{ id: 'n1' }]);
      const req: any = { user: { id: 'u1' }, query: { unreadOnly: 'true' } };
      const res = mockRes();
      const next = mockNext();

      await listNotifications(req, res as any, next);

      expect(dataStore.findNotificationsByUserId).toHaveBeenCalledWith('u1', true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('creates notification defaulting to current user', async () => {
      (dataStore.createNotification as jest.Mock).mockResolvedValue({ id: 'n1' });
      const req: any = { user: { id: 'u1' }, body: { type: 'reminder', title: 'Hi', message: 'Msg' } };
      const res = mockRes();
      const next = mockNext();

      await createNotification(req, res as any, next);

      expect(dataStore.createNotification).toHaveBeenCalledWith({
        userId: 'u1',
        type: 'reminder',
        title: 'Hi',
        message: 'Msg',
        read: false,
        taskId: undefined
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });

    it('marks notification as read', async () => {
      (dataStore.findNotificationsByUserId as jest.Mock).mockResolvedValue([{ id: 'n1' }]);
      (dataStore.markNotificationAsRead as jest.Mock).mockResolvedValue(true);
      const req: any = { user: { id: 'u1' }, params: { id: 'n1' } };
      const res = mockRes();
      const next = mockNext();

      await markNotificationRead(req, res as any, next);

      expect(dataStore.markNotificationAsRead).toHaveBeenCalledWith('n1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

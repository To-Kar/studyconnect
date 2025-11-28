import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  addTaskComment,
  getTaskComments,
  deleteTaskComment,
  exportTasksICS
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/my-tasks', getMyTasks);
router.get('/export/ics', exportTasksICS);
router.get('/:id/comments', getTaskComments);
router.post('/:id/comments', addTaskComment);
router.delete('/:id/comments/:commentId', deleteTaskComment);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;

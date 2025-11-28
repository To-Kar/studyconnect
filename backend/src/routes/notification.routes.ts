import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listNotifications, createNotification, markNotificationRead } from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.post('/', createNotification);
router.post('/:id/read', markNotificationRead);

export default router;
